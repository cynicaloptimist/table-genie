import { GetRandomEntryFromRedditTable } from "./reddit";

describe("reddit integration", () => {
    test("", () => {
        const response = GetRandomEntryFromRedditTable("trinket")
        .then(r => {
            console.log(r);
        });
    });
});