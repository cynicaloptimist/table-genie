import * as _ from "lodash";
import axios from "axios";
import * as cheerio from "cheerio";

interface RedditPost {
    title: string;
    url: string;
    selftext?: string;
    selftext_html?: string;
}

const getSubredditUrl = (searchTerm: string, limit: number) => `https://www.reddit.com/r/BehindTheTables/search.json?q=${searchTerm}&restrict_sr=on&&sort=relevance&t=all&limit=${limit}`;

async function getPosts(searchTerm: string): Promise<RedditPost [] | undefined> {
    try {
        const subredditUrl = getSubredditUrl(searchTerm, 1);
        const response = await axios.get(subredditUrl);
        const posts: RedditPost [] = response.data.data
            .children
            .filter((c: any) => c.kind == "t3" && c.data && c.data.selftext_html)
            .map((c: any) => c.data);
        return posts;
    } catch (error) {
        console.error(error);
    }
}

function getFirstPostWithRollableEntries(posts: RedditPost []): RedditPost {
    return posts[0];
}

export async function GetRandomEntryFromRedditTable(searchTerm: string) {
    const posts = await getPosts(searchTerm);
    if(posts === undefined) {
        return "";
    }
    const firstPost = getFirstPostWithRollableEntries(posts);
    if(firstPost === undefined) {
        return "";
    }
    console.log("Post title: " + firstPost.title);
    console.log("Post url: " + firstPost.url);
    const $ = cheerio.load(_.unescape(firstPost.selftext_html));
    const entries = $("li");
    const randomIndex = _.random(entries.length);
    const randomEntry = entries[randomIndex].children[0].data;
    if(randomEntry === undefined) {
        return "";
    }
    return randomEntry;
}

const searchArgument = process.argv[2];
if(searchArgument !== undefined){
    GetRandomEntryFromRedditTable(searchArgument).then(c => console.log(c));
}
