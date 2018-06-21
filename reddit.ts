import { sample, unescape } from "lodash";
import axios from "axios";
import { load } from "cheerio";

interface RedditPost {
    title: string;
    url: string;
    selftext?: string;
    selftext_html?: string;
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

function getFirstPostWithRollableEntries(posts: RedditPost []): RedditPost {
    return posts[0];
}

function getRandomEntryFromHtml(postHtml: string): string {
    const $ = load(postHtml);
    const entries = $("li, td:nth-child(2)");
    const randomEntry = sample(entries);
    if(randomEntry === undefined) {
        return "";
    }
    return $(randomEntry).text();
}

export async function GetRandomEntryFromRedditTable(searchTerm: string) {
    const posts = await getPosts(searchTerm, 10);
    if(posts === undefined) {
        return "";
    }
    const firstPost = getFirstPostWithRollableEntries(posts);
    if(firstPost === undefined) {
        return "";
    }
    console.log("Post title: " + firstPost.title);
    console.log("Post url: " + firstPost.url);
    return getRandomEntryFromHtml(unescape(firstPost.selftext_html));
}

const searchArgument = process.argv[2];
if(searchArgument !== undefined){
    GetRandomEntryFromRedditTable(searchArgument).then(c => console.log(c));
}
