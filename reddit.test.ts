import { GetRandomEntryFromRedditTable } from "./reddit";

describe("reddit integration", () => {
    test("", () => {
        expect.assertions(1);

        GetRandomEntryFromRedditTable("trinket")
            .then(r => {
                console.log(r);
                expect(r).not.toBeUndefined();
            });
    });
});