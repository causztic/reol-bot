'use strict';

const Diene = require('diene').default;
const s3 = require('./s3.js');
const { getChannel, catchErrors } = require('./../util.js');

let writeToDatabase = (pgc, client, post) => {
  pgc.query('SELECT exists(select 1 from Instagram WHERE post_id=$1)', [post.id], (err, exists) => {
    if (err) { catchErrors(client, err); }
    if (!exists.rows[0].exists) {
      // console.log("Writing to DB: ", post.media);
      client.channels.cache.get(getChannel(SM_UPDATES_ID)).send(`${post.media}`);
      s3.sendToS3(post.media);
      // if (post.description.length > 0)
      //   client.channels.cache.get(getChannel(SM_UPDATES_ID)).send(`${post.description}`);
      // send to S3 as well
      pgc.query('INSERT INTO Instagram(url, text, post_id) VALUES ($1, $2, $3);', [post.media, "", post.id])
    }
  })
}

let writeStoryToDatabase = (pgc, client, story) => {
  pgc.query('SELECT exists(select 1 from stories WHERE code=$1)', [story.code], (err, exists) => {
    if (err) { catchErrors(client, err); }
    if (!exists.rows[0].exists) {
      client.channels.cache.get(getChannel(SM_UPDATES_ID)).send(`${story.url}`);
      s3.sendToS3(story.url);
      pgc.query('INSERT INTO stories(code, url) VALUES ($1, $2);', [post.code, post.url])
    }
  })
}

let getSpecificInstagramPost = async (pgc, client, shortcode) => {
  // const graphObject = {
  //   id: '1',
  //   shortcode: shortcode,
  //   media: '',
  //   thumbnail: '',
  //   timestamp: '',
  // };

  // graphObject.setMedia = (media) => {
  //   graphObject.media = media;
  // }

  // graphObject.setDescription = (description) => {
  //   graphObject.description = description;
  // }

  // await client.ns.getPostsFrom(graphObject)
  //   .then(post => {
  //     writeToDatabase(pgc, client, post);
  //   })
}

let getLatestInstagramPost = async (pgc, client) => {
  try {
    const diene = new Diene('rrreol999', true);
    const posts = await diene.getPosts(3);
    for (const post of posts) {
      if (post.gallery) {
        for (const postItem of post.gallery) {
          writeToDatabase(pgc, client, postItem);
        }
      } else {
        // not a gallery, write individual
        writeToDatabase(pgc, client, post);
      }
    }
  } catch(error) {
    catchErrors(client, "Getting Instagram: " + String(error));
  }
}

let getStories = async (pgc, client) => {
  try {
    await client.ns.login(process.env.USERNAME, process.env.PASSWORD);
    const stories = await client.ns.getStories();
    for (const story of stories) {
      writeStoryToDatabase(pgc, client, story);
    }
  } catch(error) {
    catchErrors(client, error);
  }
}

// https://gist.github.com/mcraz/11349449
function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
      return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
      return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
      return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
      return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
      return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

let getBroadcasting = async (client) => {
  try {
    await client.ns.login(process.env.USERNAME, process.env.PASSWORD);
    const data = await client.ns.getBroadcastInfo();
    if (data.live) {
      if (!client.isBroadcasting) {
        // not set to broadcasting yet
        time = timeSince(data.started);
        client.channels.cache.get(getChannel(SM_UPDATES_ID)).send(`Reol is live on Instagram! Started ${time} ago`);
        client.isBroadcasting = true;
      }
      // already set to broadcasting, ignore
    } else {
      client.isBroadcasting = false;
    }
  } catch(error) {
    console.error(error);
  }
}

module.exports = { getSpecificInstagramPost, getLatestInstagramPost, getStories, getBroadcasting }