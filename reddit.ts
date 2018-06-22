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
    rollPrompt: string;
    rollResult: string;
}

interface TableResult {
    postTitle: string;
    postUrl: string;
    rollResults: RollResult[]
}

const getSubredditUrl = (searchTerm: string, limit: number) => `https://www.reddit.com/r/BehindTheTables/search.json?q=${searchTerm}&restrict_sr=on&sort=relevance&t=all&limit=${limit}`;

function getPostsFromResponse(response: any): RedditPost[] {
    return response.data.data
        .children
        .filter((c: any) => c.kind == "t3" && c.data && c.data.selftext_html)
        .map((c: any) => c.data);
}

async function getPosts(searchTerm: string, limit: number): Promise<RedditPost[] | undefined> {
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

function generateRollResultsFromPost(postHtml: string): RollResult[] {
    const $ = load(postHtml);
    const orderedLists = $("ol");
    const listResults = orderedLists.toArray().map(
        header => {
            const listHeader = $(header).prev("p").children("strong").text();
            const listItems = $(header).children("li").toArray().map(c => $(c).text());;
            const randomEntry = _.sample(listItems);

            if (randomEntry == undefined) {
                throw "Could not sample table.";
            }

            return {
                rollPrompt: listHeader,
                rollResult: randomEntry
            }
        }
    );

    const entries = $("li, td:nth-child(2)");
    const randomEntry = _.sample(entries);

    if (randomEntry === undefined) {
        throw "Couldn't get a random entry.";
    }

    return listResults;
}

export async function GetRandomEntryFromRedditTable(searchTerm: string): Promise<TableResult | undefined> {
    const posts = await getPosts(searchTerm, 10);
    if (posts === undefined) {
        throw "Couldn't get posts.";
    }
    const firstPost = getFirstPostWithRollableEntries(posts);
    if (firstPost === undefined) {
        throw "Couldn't find any rollable tables.";
    }
    console.log("Post title: " + firstPost.title);
    console.log("Post url: " + firstPost.url);
    const rollResults = generateRollResultsFromPost(_.unescape(firstPost.selftext_html));
    return {
        postTitle: firstPost.title,
        postUrl: firstPost.url,
        rollResults: rollResults
    }
}
