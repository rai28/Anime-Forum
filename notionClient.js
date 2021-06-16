const { client, Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function getTags() {
  const database = await notion.databases.retrieve({
    database_id: process.env.DATABASE_ID,
  });
  return notionPropertiesById(database.properties)[
    process.env.NOTION_TAGS_ID
  ].multi_select.options.map((option) => {
    return { id: option.id, name: option.name };
  });
}

function notionPropertiesById(properties) {
  return Object.values(properties).reduce((obj, property) => {
    const { id, ...rest } = property;
    return { ...obj, [id]: rest };
  }, {});
}

function createForum({ title, description, tags }) {
  notion.pages.create({
    parent: {
      database_id: process.env.DATABASE_ID,
    },
    properties: {
      [process.env.NOTION_ANIME_NAME_ID]: {
        title: [
          {
            type: "text",
            text: {
              content: title,
            },
          },
        ],
      },
      [process.env.NOTION_DESCRIPTION_ID]: {
        rich_text: [
          {
            type: "text",
            text: {
              content: description,
            },
          },
        ],
      },
      [process.env.NOTION_VOTES_ID]: {
        number: 0,
      },
      [process.env.NOTION_TAGS_ID]: {
        multi_select: tags.map((tag) => {
          return { id: tag.id };
        }),
      },
    },
  });
}

async function getForum() {
  const notionPages = await notion.databases.query({
    database_id: process.env.DATABASE_ID,
    sorts: [{ property: process.env.NOTION_VOTES_ID, direction: "descending" }],
  });

  return notionPages.results.map(fromNotionObject);
}

function fromNotionObject(notionPage) {
  const propertiesById = notionPropertiesById(notionPage.properties);
  return {
    id: notionPage.id,
    title: propertiesById[process.env.NOTION_ANIME_NAME_ID].title[0].plain_text,
    votes: propertiesById[process.env.NOTION_VOTES_ID].number,
    tags: propertiesById[process.env.NOTION_TAGS_ID].multi_select.map(
      (option) => {
        return { id: option.id, name: option.name };
      }
    ),
    description:
      propertiesById[process.env.NOTION_DESCRIPTION_ID].rich_text[0].text
        .content,
  };
}

async function upVoteSuggestion(pageId) {
  const suggestion = await getSuggestion(pageId);
  const votes = suggestion.votes + 1;
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [process.env.NOTION_VOTES_ID]: { number: votes },
    },
  });

  return votes;
}

async function getSuggestion(pageId) {
  return fromNotionObject(await notion.pages.retrieve({ page_id: pageId }));
}

module.exports = {
  createForum,
  getTags,
  getForum,
  upVoteSuggestion,
};
