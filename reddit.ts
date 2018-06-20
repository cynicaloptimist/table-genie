import * as _ from "lodash";
import axios from "axios";
import * as cheerio from "cheerio";

const getSubredditUrl = (searchTerm: string, limit: number) => `https://www.reddit.com/r/BehindTheTables/search.json?q=${searchTerm}&restrict_sr=on&&sort=relevance&t=all&limit=${limit}`;

async function getSelfPostHtmlContents(searchTerm: string): Promise<string [] | undefined> {
    try {
        const subredditUrl = getSubredditUrl(searchTerm, 1);
        const response = await axios.get(subredditUrl);
        const selfPostHtmlContents: string [] = response.data.data
            .children
            .filter((c: any) => c.kind == "t3")
            .map((c: any) => c.data.selftext_html)
            .filter((c: any) => c !== null);
        return selfPostHtmlContents;
    } catch (error) {
        console.error(error);
    }
}

export async function GetRandomEntryFromRedditTable(searchTerm: string) {
    const posts = await getSelfPostHtmlContents(searchTerm);
    if(posts === undefined) {
        return "";
    }
    const searchRegex = new RegExp(searchTerm);
    const postsWithSearchTerm = posts.filter(p => searchRegex.test(p));
    const firstPost = postsWithSearchTerm[0];
    if(firstPost === undefined) {
        return "";
    }
    const $ = cheerio.load(_.unescape(firstPost));
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
