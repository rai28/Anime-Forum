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
app.get("/", async (req, res) => {
  const respForum = await getForum();
  res.render("index", { tags, respForum });
});
app.post("/create-forum", async (req, res) => {
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
  res.redirect("/");
});
app.get("/about-this", (req, res) => {
  res.render("about-this");
});
app.post("/up-vote-suggestion", async (req, res) => {
  const votes = await upVoteSuggestion(req.body.suggestionId);
  res.json({ votes });
});
app.listen(PORT);
