import * as _ from "lodash";
import axios from "axios";
import { load } from "cheerio";

interface RedditPost {
    title: string;
    url: string;
    selftext?: string;
    selftext_html?: string;
}

interface RollResult {
    postTitle: string;
    postUrl: string;
    rolls: {
        rollPrompt: string;
        rollResult: string;
    } []
}

const getSubredditUrl = (searchTerm: string, limit: number) => `https://www.reddit.com/r/BehindTheTables/search.json?q=${searchTerm}&restrict_sr=on&&sort=relevance&t=all&limit=${limit}`;

function getPostsFromResponse(response: any): RedditPost[] {
    return response.data.data
    .children
    .filter((c: any) => c.kind == "t3" && c.data && c.data.selftext_html)
    .map((c: any) => c.data);
}

async function getPosts(searchTerm: string, limit: number): Promise<RedditPost [] | undefined> {
    try {
        const subredditUrl = getSubredditUrl(searchTerm, limit);
        const response = await axios.get(subredditUrl);
        return getPostsFromResponse(response);
    } catch (error) {
        console.error(error);
    }
}

function getFirstPostWithRollableEntries(posts: RedditPost[]): RedditPost {
    const rollableEntryClue = new RegExp(/(table|ol)/i);
    const firstPost = _.find(posts, (post) => rollableEntryClue.test(post.selftext_html || ""));
    if (firstPost == undefined) {
        throw "Couldn't find any rollable entries.";
    }
    return firstPost;
}

function getRandomEntryFromHtml(postHtml: string): string {
    const $ = load(postHtml);
    const entries = $("li, td:nth-child(2)");
    const randomEntry = _.sample(entries);
    if(randomEntry === undefined) {
        return "";
    }
    return $(randomEntry).text();
}

export async function GetRandomEntryFromRedditTable(searchTerm: string): Promise<RollResult | undefined> {
    const posts = await getPosts(searchTerm, 10);
    if(posts === undefined) {
        throw "Couldn't get posts.";
    }
    const firstPost = getFirstPostWithRollableEntries(posts);
    if(firstPost === undefined) {
        throw "Couldn't find any rollable tables.";
    }
    console.log("Post title: " + firstPost.title);
    console.log("Post url: " + firstPost.url);
    const rollResult = getRandomEntryFromHtml(_.unescape(firstPost.selftext_html));
    return {
        postTitle: firstPost.title,
        postUrl: firstPost.url,
        rolls: [
            {
                rollPrompt: "",
                rollResult: rollResult
            }
        ]
    }
}

const searchArgument = process.argv[2];
if(searchArgument !== undefined){
    GetRandomEntryFromRedditTable(searchArgument).then(c => console.log(c));
}
