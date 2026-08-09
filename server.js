const express = require('express'); 
const axios = require("axios");
const cors = require('cors');
const pool = require('./db/db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ==================================
   GET ALL PROJECTS
================================== */
app.get('/projects', async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT

                p.*,

                COUNT(par.id) AS parcel_count,

                COUNT(CASE WHEN UPPER(par.status) = 'AVAILABLE' THEN 1 END) AS available,

                COUNT(CASE WHEN UPPER(par.status) = 'RESERVED' THEN 1 END) AS reserved,

                COUNT(CASE WHEN UPPER(par.status) = 'SOLD' THEN 1 END) AS sold

            FROM projects p

            LEFT JOIN parcels par

            ON p.id = par.project_id

            GROUP BY p.id

            ORDER BY p.id;

        `);

        res.json(result.rows);

    }

    catch(err){

        console.error(err);

        res.status(500).send("Error fetching projects");

    }

});

/* ==================================
   PORTFOLIO VIEW
================================== */

app.get('/portfolio', async (req, res) => {

    try{

        const result = await pool.query(`

            SELECT

                id,

                project_code,

                project_name,

                location,

                latitude,

                longitude,

                image_url,

                price_from,

                plot_size

            FROM projects

            ORDER BY project_name;

        `);

        res.json(result.rows);

    }

    catch(err){

        console.error(err);

        res.status(500).json(err);

    }

});

/* ==================================
   GET ONE PROJECT
================================== */
app.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

   const result = await pool.query(`

SELECT

    p.*,

    COUNT(pa.id) AS parcel_count,

    COUNT(*) FILTER (WHERE pa.status='AVAILABLE') AS available,

    COUNT(*) FILTER (WHERE pa.status='RESERVED') AS reserved,

    COUNT(*) FILTER (WHERE pa.status='SOLD') AS sold

FROM projects p

LEFT JOIN parcels pa

ON p.id = pa.project_id

WHERE p.id = $1

GROUP BY p.id;

`, [id]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching project');
  }
});

/* ==================================
   GET PROJECT PARCELS AS GEOJSON
   WITH PROPERTY INTELLIGENCE
================================== */

app.get('/projects/:id/parcels', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',

              'geometry',
              ST_AsGeoJSON(p.geom)::jsonb,

              'properties',
              jsonb_build_object(
                'id', p.id,
                'parcel_no', p.parcel_no,
                'price', p.price,
                'status', p.status,
                'size', p.size,
                'area', p.area,
                'property_id', p.property_id,

                'intelligence',
                to_jsonb(pi)
              )
            )
          ),
          '[]'::jsonb
        )
      ) AS geojson

      FROM public.parcels p

      LEFT JOIN public.parcel_intelligence pi
        ON pi.parcel_id = p.id

      WHERE p.project_id = $1;
    `, [id]);

    res.json(result.rows[0].geojson);

  } catch (err) {
    console.error('Parcel GeoJSON error:', err);
    res.status(500).json({
      error: 'Error generating GeoJSON',
      details: err.message
    });
  }
});

app.get("/parcels/geojson", async (req, res) => {

  try {

    const result = await pool.query(`

      SELECT
        p.*,
        ST_AsGeoJSON(p.geom)::json AS geometry,
        to_jsonb(pi) AS intelligence

      FROM public.parcels p

      LEFT JOIN public.parcel_intelligence pi
        ON pi.parcel_id = p.id

    `);

    const geojson = {

      type: "FeatureCollection",

      features: result.rows.map(row => ({

        type: "Feature",

        geometry: row.geometry,

        properties: {

          id: row.id,
          project_id: row.project_id,
          property_id: row.property_id,
          parcel_no: row.parcel_no,
          price: row.price,
          status: row.status,
          size: row.size,
          area: row.area,

          intelligence: row.intelligence

        }

      }))

    };

    res.json(geojson);

  }

  catch (err) {

    console.error("Global parcel GeoJSON error:", err);

    res.status(500).json({
      error: "Error generating parcel GeoJSON",
      details: err.message
    });

  }

});

app.get('/projects/:id/parcel-list', async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(`

            SELECT
                p.*,
                pr.project_name

            FROM parcels p

            JOIN projects pr
            ON p.project_id = pr.id

            WHERE p.project_id = $1

            ORDER BY p.parcel_no;

        `, [id]);

        res.json(result.rows);

    }

    catch(err){

        console.error(err);

        res.status(500).send("Error fetching parcels");

    }

});
/* ==================================
   TEST DATABASE
================================== */
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM parcels'
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection failed');
  }
});

const PORT = process.env.PORT || 3000; 

app.post('/reserve', async (req, res) => {

    try {

        const {

            parcel_id,
            customer_name,
            phone,
            email,
            national_id

        } = req.body;

        // Save reservation

        const reservationNo =
"RES-" +
Date.now();
await pool.query(

`
INSERT INTO reservations
(

reservation_no,
parcel_id,
customer_name,
phone,
email,
national_id,
reserved_by

)

VALUES

(

$1,$2,$3,$4,$5,$6,$7

)

`,

[
reservationNo,
parcel_id,
customer_name,
phone,
email,
national_id,
"Sales Office"
]

);


        // Update parcel status
        await pool.query(

            `UPDATE parcels
             SET status='Reserved'
             WHERE id=$1`,

            [parcel_id]

        );

        res.json({

success:true,

reservationNo

});

    }

    catch(err){

        console.error(err);

        res.status(500).json(err);

    }

}); 

app.get('/reservations', async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT

                r.id,
                r.reservation_no,
                r.customer_name,
                r.phone,
                r.email,
                r.national_id,
                r.status,
                r.reserved_on,

                p.parcel_no,
                p.price,

                pr.project_name

            FROM reservations r

            JOIN parcels p
                ON r.parcel_id = p.id

            JOIN projects pr
                ON p.project_id = pr.id

            ORDER BY r.reserved_on DESC

        `);

        res.json(result.rows);

    }

    catch(err){

        console.log(err);

        res.status(500).json(err);

    }

}); 

app.get("/customers", async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT

                customer_name,

                phone,

                email,

                national_id,

                COUNT(*) AS reservations,

                SUM(p.price) AS total_value

            FROM reservations r

            JOIN parcels p

            ON r.parcel_id = p.id

            GROUP BY

                customer_name,

                phone,

                email,

                national_id

            ORDER BY customer_name;

        `);

        res.json(result.rows);

    }

    catch(err){

        console.log(err);

        res.status(500).json(err);

    }

}); 

app.get("/parcels/:id", async (req, res) => {

    try{

        const { id } = req.params;

        const result = await pool.query(

            `SELECT * FROM parcels WHERE id=$1`,

            [id]

        );

        res.json(result.rows[0]);

    }

    catch(err){

        console.log(err);

        res.status(500).json(err);

    }

});

app.get("/parcels", async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT

                p.id,
                p.parcel_no,
                p.property_id,
                p.price,
                p.status,
                p.size,
                p.area,
                pr.project_name

            FROM parcels p

            JOIN projects pr
            ON p.project_id = pr.id

            ORDER BY pr.project_name, p.parcel_no;

        `);

        res.json(result.rows);

    }

    catch(err){

        console.log(err);

        res.status(500).json(err);

    } 

}); 

 app.put("/parcels/:id", async (req, res) => {

    try{

        const { id } = req.params;

        const {

            price,
            status,
            size,
            area

        } = req.body;

        await pool.query(

            `

            UPDATE parcels

            SET

                price=$1,
                status=$2,
                size=$3,
                area=$4

            WHERE id=$5

            `,

            [

                price,
                status,
                size,
                area,
                id

            ]

        );

        res.json({

            success:true

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json(err);

    }

});

app.get('/dashboard/stats', async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT

                (SELECT COUNT(*) FROM projects) AS total_projects,

                (SELECT COUNT(*) FROM parcels) AS total_parcels,

                (SELECT COUNT(*) FROM parcels WHERE status='AVAILABLE') AS available,

                (SELECT COUNT(*) FROM parcels WHERE status='RESERVED') AS reserved,

                (SELECT COUNT(*) FROM parcels WHERE status='SOLD') AS sold;

        `);

        res.json(result.rows[0]);

    }

    catch(err){

        console.error(err);

        res.status(500).send("Error loading dashboard");

    }

}); 

app.get('/dashboard/project-performance', async (req, res) => {

    try {

        const result = await pool.query(`

            SELECT

    pr.id,

    pr.project_name,

    pr.location,

    pr.image_url,

    COUNT(*) FILTER (WHERE UPPER(p.status)='SOLD') AS sold,

    COUNT(*) FILTER (WHERE UPPER(p.status)='AVAILABLE') AS available,

    COUNT(*) FILTER (WHERE UPPER(p.status)='RESERVED') AS reserved,

    COUNT(p.id) AS total

            FROM projects pr

            LEFT JOIN parcels p
            ON pr.id = p.project_id

            GROUP BY

pr.id,

pr.project_name,

pr.location,

pr.image_url

            ORDER BY
COUNT(*) FILTER (WHERE p.status = 'SOLD') DESC,
pr.project_name ASC;

        `);

        res.json(result.rows);

    }

    catch(err){

        console.error(err);

        res.status(500).send("Error loading project performance");

    }

}); 

app.get("/roads", async (req, res) => {

    try {

        const { south, west, north, east } = req.query;

        const overpassQuery = `
        [out:json];
        (
          way["highway"](${south},${west},${north},${east});
        );
        out geom;
        `;

       const response = await axios({

    method: "post",

    url: "https://overpass-api.de/api/interpreter",

    data: overpassQuery,

    headers: {

        "Content-Type": "application/x-www-form-urlencoded",

        "Accept": "application/json"

    }

});

        res.json(response.data);

    }

    catch (err) {

        console.error(err.message);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});