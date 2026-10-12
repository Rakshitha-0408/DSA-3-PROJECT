// ============================================================
// NEWS & SOCIAL MEDIA ANALYTICS ENGINE
// Frontend connected to the actual Java DSA engine
// through Node.js + Express.
// ============================================================

const pageInfo = {
    overview: {
        title: "Overview",
        subtitle: "Monitor content, priorities, duplicates and moderation activity"
    },
    feed: {
        title: "Live Feed",
        subtitle: "Latest news and social posts in the analytics pipeline"
    },
    search: {
        title: "Search Intelligence",
        subtitle: "Find relevant posts by title, content or topic"
    },
    duplicates: {
        title: "Duplicate Detection",
        subtitle: "Hash-based identification of repeated content"
    },
    ranking: {
        title: "Priority Ranking",
        subtitle: "High-priority content ranked using a Max Heap"
    },
    clusters: {
        title: "Story Clusters",
        subtitle: "Related posts organized by topic"
    },
    moderation: {
        title: "Moderation Center",
        subtitle: "Queue management and moderator assignment"
    },
    relationships: {
        title: "Content Relationships",
        subtitle: "Graph connections between posts and topics"
    }
};

async function getAPI(endpoint) {
    const response = await fetch(endpoint);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
    }

    return response.json();
}

function showPage(page, button) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active-page");
    });

    document.getElementById(page).classList.add("active-page");

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    button.classList.add("active");

    document.getElementById("page-title").textContent = pageInfo[page].title;
    document.getElementById("page-subtitle").textContent = pageInfo[page].subtitle;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function initialize() {
    try {
        setSystemStatus("JAVA DSA ENGINE CONNECTED");

        const [posts, stats, ranking, duplicates, clusters, moderation, relationships] =
            await Promise.all([
                getAPI("/api/posts"),
                getAPI("/api/stats"),
                getAPI("/api/ranking"),
                getAPI("/api/duplicates"),
                getAPI("/api/clusters"),
                getAPI("/api/moderation"),
                getAPI("/api/relationships")
            ]);

        updateStatistics(stats);
        renderFeed(posts);
        renderPriorityPreview(ranking);
        renderTopicPreview(clusters);
        renderDuplicates(duplicates);
        renderRanking(ranking);
        renderClusters(clusters);
        renderModeration(moderation);
        renderRelationships(relationships);
    } catch (error) {
        console.error("Unable to connect to Java DSA engine:", error);
        setSystemStatus("BACKEND CONNECTION ERROR");
        alert("Could not connect to the Java DSA engine.\n\n" + error.message);
    }
}

function setSystemStatus(message) {
    const status = document.querySelector(".system-status small");
    if (status) status.textContent = message;
}

function updateStatistics(stats) {
    document.getElementById("totalPosts").textContent = stats.totalPosts;
    document.getElementById("totalTopics").textContent = stats.totalTopics;
    document.getElementById("totalDuplicates").textContent = stats.totalDuplicates;
    document.getElementById("moderationCount").textContent = stats.moderationCount;
}

function renderFeed(posts) {
    const table = document.getElementById("feedTable");
    table.innerHTML = "";

    posts.forEach(post => {
        table.innerHTML += `
            <tr>
                <td>${post.id}</td>
                <td>${escapeHtml(post.title)}</td>
                <td>${escapeHtml(post.topic)}</td>
                <td>${escapeHtml(post.source)}</td>
                <td><strong>${post.priority}</strong></td>
            </tr>
        `;
    });
}

function renderPriorityPreview(ranking) {
    const container = document.getElementById("priorityPreview");
    container.innerHTML = "";

    ranking.slice(0, 5).forEach((post, index) => {
        container.innerHTML += `
            <div class="priority-row">
                <div class="priority-rank">${String(index + 1).padStart(2, "0")}</div>
                <div class="priority-content">
                    <div class="priority-title">${escapeHtml(post.title)}</div>
                    <div class="priority-meta">
                        ${escapeHtml(post.topic)} • ${escapeHtml(post.source)}
                    </div>
                </div>
                <div class="priority-score">${post.priority}</div>
            </div>
        `;
    });
}

function renderTopicPreview(clusters) {
    const container = document.getElementById("topicPreview");
    container.innerHTML = "";

    clusters.forEach(cluster => {
        container.innerHTML += `
            <div class="topic-row">
                <span class="topic-name">${escapeHtml(cluster.topic)}</span>
                <span class="topic-count">${cluster.posts.length} posts</span>
            </div>
        `;
    });
}

async function searchPosts() {
    const input = document.getElementById("searchInput");
    const query = input.value.trim();
    const table = document.getElementById("searchTable");

    table.innerHTML = "";
    if (!query) return;

    try {
        const results = await getAPI(`/api/search?q=${encodeURIComponent(query)}`);

        results.forEach(post => {
            table.innerHTML += `
                <tr>
                    <td>${post.id}</td>
                    <td>${escapeHtml(post.title)}</td>
                    <td>${escapeHtml(post.topic)}</td>
                    <td>${escapeHtml(post.source)}</td>
                    <td>${post.priority}</td>
                </tr>
            `;
        });

        if (results.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5">No matching posts found.</td>
                </tr>
            `;
        }
    } catch (error) {
        table.innerHTML = `
            <tr>
                <td colspan="5">Search service unavailable.</td>
            </tr>
        `;
        console.error(error);
    }
}

function clearSearch() {
    document.getElementById("searchInput").value = "";
    document.getElementById("searchTable").innerHTML = "";
    document.getElementById("searchInput").focus();
}

function renderDuplicates(duplicates) {
    const table = document.getElementById("duplicateTable");
    table.innerHTML = "";

    duplicates.forEach(item => {
        table.innerHTML += `
            <tr>
                <td>Post ${item.original.id}</td>
                <td>Post ${item.duplicate.id}</td>
                <td>${escapeHtml(item.duplicate.title)}</td>
                <td><strong>DUPLICATE</strong></td>
            </tr>
        `;
    });

    if (duplicates.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4">No duplicate content detected.</td>
            </tr>
        `;
    }
}

function renderRanking(ranking) {
    const table = document.getElementById("rankingTable");
    table.innerHTML = "";

    ranking.forEach((post, index) => {
        table.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${post.id}</td>
                <td>${escapeHtml(post.title)}</td>
                <td>${escapeHtml(post.topic)}</td>
                <td>${escapeHtml(post.source)}</td>
                <td><strong>${post.priority}</strong></td>
            </tr>
        `;
    });
}

function renderClusters(clusters) {
    const container = document.getElementById("clusterContainer");
    container.innerHTML = "";

    clusters.forEach(cluster => {
        let html = `
            <div class="cluster">
                <div class="cluster-title">${escapeHtml(cluster.topic)}</div>
        `;

        cluster.posts.forEach(post => {
            html += `
                <div class="cluster-post">
                    Post ${post.id} — ${escapeHtml(post.title)}
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML += html;
    });
}

function renderModeration(data) {
    const moderatorTable = document.getElementById("moderatorTable");
    moderatorTable.innerHTML = "";

    data.assignments.forEach(item => {
        moderatorTable.innerHTML += `
            <tr>
                <td>Post ${item.postId}</td>
                <td>${escapeHtml(item.moderator)}</td>
            </tr>
        `;
    });

    const queueTable = document.getElementById("queueTable");
    queueTable.innerHTML = "";

    data.queue.forEach((post, index) => {
        queueTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>Post ${post.id}</td>
                <td>${post.priority}</td>
            </tr>
        `;
    });
}

function renderRelationships(groups) {
    const container = document.getElementById("relationshipMap");
    container.innerHTML = "";

    groups.forEach(group => {
        let html = `
            <div class="relationship-group">
                <div class="relationship-topic">
                    <span class="topic-node"></span>
                    <span>${escapeHtml(group.topic)}</span>
                    <small>${group.posts.length} posts</small>
                </div>
                <div class="relationship-posts">
        `;

        group.posts.forEach(post => {
            html += `
                <div class="relationship-post">
                    <span class="connection-line"></span>
                    <span class="post-node"></span>
                    <div class="relationship-post-info">
                        <strong>Post ${post.id}</strong>
                        <span>${escapeHtml(post.title)}</span>
                    </div>
                    <div class="relationship-priority">${post.priority}</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML += html;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("searchInput");

    if (input) {
        input.addEventListener("keydown", event => {
            if (event.key === "Enter") searchPosts();
        });
    }

    initialize();
});
