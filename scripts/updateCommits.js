const fs = require("fs");
const axios = require("axios");

const username = process.env.GH_USERNAME;
const token = process.env.GH_TOKEN;
const headers = { Authorization: `token ${token}` };

const excludeRepos = [
  "markuptitan",
  "project-1",
  "acn-syllabus",
  "bbd-immersion-day-booking",
];

async function getCommitCount() {
  const repos = await axios.get(
  `https://api.github.com/users/${username}/repos?per_page=100`,
  { headers }
);


  let totalCommits = 0;

  for (const repo of repos.data) {
    if (excludeRepos.includes(repo.name.toLowerCase())) continue;

    const commits = await axios.get(
      `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`,
      { headers }
    );

    const linkHeader = commits.headers.link;
    if (linkHeader && linkHeader.includes('rel="last"')) {
      const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
      const count = match ? parseInt(match[1]) : 1;
      totalCommits += count;
    } else {
      totalCommits += commits.data.length;
    }
  }

  return totalCommits;
}

(async () => {
  const total = await getCommitCount();

  const badge = `<img src="https://img.shields.io/badge/COMMITS-${total}-blue?style=flat-square&color=blue" height="25"/>`;

  const readme = fs.readFileSync("README.md", "utf8");
  const updated = readme.replace(
    /<img src="https:\/\/img\.shields\.io\/badge\/COMMITS-.*?" height="25"\/>/,
    badge
  );

  if (readme !== updated) {
    fs.writeFileSync("README.md", updated);
    console.log(`README updated with ${total} commits`);
  } else {
    console.log("No change in commit count. Skipping write.");
  }
})();
