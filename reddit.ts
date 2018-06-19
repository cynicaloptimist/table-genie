import * as _ from "lodash";
import axios from "axios";

const subredditUrl = "http://www.reddit.com/r/BehindTheTables.json?limit=10";

async function getSelfPostHtmlContents(): Promise<string [] | undefined> {
    try {
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
    const posts = await getSelfPostHtmlContents();
    if(posts === undefined) {
        return "";
    }
    const searchRegex = new RegExp(searchTerm);
    const postsWithSearchTerm = posts.filter(p => searchRegex.test(p));
    return postsWithSearchTerm;
}

GetRandomEntryFromRedditTable("spotty").then(c => console.log(c));