import { GetRandomEntryFromRedditTable } from "./reddit";

describe("reddit integration", () => {
    test("", done => {
        expect.assertions(1);

        GetRandomEntryFromRedditTable("trinket")
            .then(r => {
                console.log(r);
                expect(r).not.toBeUndefined();
                done();
            });
    });
});