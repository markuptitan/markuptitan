const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const GITHUB_USER = "MarkupTitan";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function getRecentRepos() {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=3`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  const data = await res.json();
  return data.map((repo) => repo.full_name);
}

async function fetchCommits(repo) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/commits?per_page=2`,
    {
      headers: {
        Authorization: `Bearer ${{ PERSONAL_TOKEN }}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  const data = await res.json();
  return data.map((commit) => ({
    message: commit.commit.message.split("\n")[0],
    url: commit.html_url,
    date: commit.commit.author.date,
    repo: repo.split("/")[1],
  }));
}

(async () => {
  const repos = await getRecentRepos();
  let allCommits = [];

  for (const repo of repos) {
    const commits = await fetchCommits(repo);
    allCommits.push(...commits);
  }

  let table = `
| Message | Repo | Date |
|--------|------|------|
${allCommits
  .map(
    (c) =>
      `| [${c.message}](${c.url}) | \`${c.repo}\` | ${new Date(
        c.date
      ).toLocaleString()} |`
  )
  .join("\n")}
`;

  const section = `
## 🔄 Recent Commits (Updated every 6 hours)

${table}
`;

  const readmePath = path.resolve("README.md");
  const readme = fs.readFileSync(readmePath, "utf-8");

  const newReadme = readme.replace(
    /<!--recent-commits-start-->[\s\S]*<!--recent-commits-end-->/,
    `<!--recent-commits-start-->\n${section}\n<!--recent-commits-end-->`
  );

  fs.writeFileSync(readmePath, newReadme);
})();
