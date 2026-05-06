import { inferSchema } from "../../src/core/inferSchema.js";

describe("inferSchema", () => {
  test("should infer basic types", () => {
    const data = {
      userId: 123,
      name: "John",
      isActive: true,
      tags: ["admin", "user"],
      profile: {
        age: 30,
        email: "john@example.com",
      },
      posts: [
        { postId: 1, title: "Post 1" },
        { postId: 2, title: "Post 2" },
      ],
      metadata: null,
    };

    const expectedSchema = {
      userId: "number",
      name: "string",
      isActive: "boolean",
      tags: ["string"],
      profile: {
        age: "number",
        email: "string",
      },
      posts: [
        {
          postId: "number",
          title: "string",
        },
      ],
      metadata: "null",
    };

    expect(inferSchema(data)).toEqual(expectedSchema);
  });

  test("should handle empty objects and arrays", () => {
    const data = {
      emptyObject: {},
      emptyArray: [],
    };

    const expectedSchema = {
      emptyObject: {},
      emptyArray: [],
    };

    expect(inferSchema(data)).toEqual(expectedSchema);
  });
});
