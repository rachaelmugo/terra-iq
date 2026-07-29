function createProjectCard(project) {

    return `

    <div class="projectCard">

        <img
            class="projectCardImage"
            src="${project.image_url}"
            alt="${project.project_name}"
        >

        <div class="projectCardBody">

            <div class="projectCardCode">

                ${project.project_code}

            </div>

            <h3>

                ${project.project_name}

            </h3>

            <p>

                📍 ${project.location}

            </p>

            <div class="projectCardStats">

                <span>🟢 ${project.available} Available</span>

                <span>🔴 ${project.sold} Sold</span>

            </div>

            <div class="projectCardPrice">

                From KSh ${Number(project.price_from).toLocaleString()}

            </div>

            <button
                class="openProjectBtn"
                onclick="loadProject(${project.id})">

                Open Project

            </button>

        </div>

    </div>

    `;

}