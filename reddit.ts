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

function getFirstPostWithRollableEntries(posts: RedditPost[]): RedditPost | undefined {
    const firstPost = _.find(posts, (post: RedditPost) => {
        if(!post.selftext_html) {
            return false;
        }
        const $ = load(_.unescape(post.selftext_html) || "");
        return $("ol li").add("table td").length > 0;
    });

    return firstPost;
}

function generateRollResultsFromPost(postHtml: string): RollResult[] {
    const $ = load(postHtml);
    const orderedLists = $("ol");
    const listResults: RollResult[] = orderedLists.toArray().map(
        list => {
            const listHeader = $(list).prev("p").children("strong").text().replace(/d\d+/gi, "");
            const listItems = $(list).children("li").toArray().map(c => $(c).text());;
            const randomEntry = _.sample(listItems);

            if (randomEntry == undefined) {
                throw "Could not sample list: " + listHeader;
            }

            return {
                rollPrompt: listHeader,
                rollResult: randomEntry
            }
        }
    );

    const tables = $("table");
    const tableResults: RollResult[] = tables.toArray().map(
        table => {
            const tableHeader = $(table).find("th:nth-child(2)").text();
            const tableItems = $(table).find("td:nth-child(2)").toArray().map(td => $(td).text());
            const randomEntry = _.sample(tableItems);

            if (randomEntry == undefined) {
                throw "Could not sample table: " + tableHeader;
            }

            return {
                rollPrompt: tableHeader,
                rollResult: randomEntry
            }
        }
    );

    return [...listResults, ...tableResults];
}

export async function GetRandomEntryFromRedditTable(searchTerm: string): Promise<TableResult> {
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
