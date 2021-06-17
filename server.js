require("dotenv").config();
const express = require("express");
const {
  getTags,
  createForum,
  getForum,
  upVoteSuggestion,
} = require("./notionClient");
const app = express();
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
let tags = [];
getTags().then((data) => {
  tags = data;
});
setInterval(async () => {
  tags = await getTags();
}, 1000 * 60 * 60);

const notionClient = require("./notionClient");
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/anime", (req, res) => {
  res.render("index");
});

app.get("/anime/anime-forum", async (req, res) => {
  const respForum = await getForum();
  res.render("anime-forum", { tags, respForum });
});
app.post("/anime/anime-forum/create-forum", async (req, res) => {
  const { title, author, description, tagIds = [] } = req.body;

  await notionClient.createForum({
    title,
    description,
    author,
    tags: Array.isArray(tagIds)
      ? tagIds
      : [tagIds].map((tagId) => {
          return { id: tagId };
        }),
  });
  res.redirect("/anime/anime-forum");
});
app.get("/anime/anime-forum/about-this", (req, res) => {
  res.render("about-this");
});
app.post("/anime/anime-forum/up-vote-suggestion", async (req, res) => {
  const votes = await upVoteSuggestion(req.body.suggestionId);
  res.json({ votes });
});
app.listen(PORT);
