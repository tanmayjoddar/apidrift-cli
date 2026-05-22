import fs from "fs";
import { jest } from "@jest/globals";
import {
  sanitizeTag,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
} from "../../src/storage/snapshotStore.js";

describe("snapshotStore", () => {
  let existsSpy;
  let writeSpy;
  let readSpy;
  let readdirSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    existsSpy = jest.spyOn(fs, "existsSync").mockImplementation(() => false);
    writeSpy = jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    readSpy = jest.spyOn(fs, "readFileSync").mockImplementation(() => "");
    readdirSpy = jest.spyOn(fs, "readdirSync").mockImplementation(() => []);
  });

  afterEach(() => {
    existsSpy.mockRestore();
    writeSpy.mockRestore();
    readSpy.mockRestore();
    readdirSpy.mockRestore();
  });

  describe("sanitizeTag", () => {
    test("passes safe tags through unchanged", () => {
      expect(sanitizeTag("v1.0.13")).toBe("v1.0.13");
      expect(sanitizeTag("prod-users")).toBe("prod-users");
      expect(sanitizeTag("my_tag")).toBe("my_tag");
    });

    test("replaces invalid characters with underscores", () => {
      expect(sanitizeTag("v1.0:beta")).toBe("v1.0_beta");
      expect(sanitizeTag("my tag")).toBe("my_tag");
      expect(sanitizeTag("tag/sub")).toBe("tag_sub");
      expect(sanitizeTag("tag\\sub")).toBe("tag_sub");
    });

    test("collapses consecutive underscores", () => {
      expect(sanitizeTag("my__tag")).toBe("my_tag");
      expect(sanitizeTag("my:::tag")).toBe("my_tag");
    });

    test("removes leading/trailing underscores and dots", () => {
      expect(sanitizeTag("_my_tag_")).toBe("my_tag");
      expect(sanitizeTag(".my_tag.")).toBe("my_tag");
      expect(sanitizeTag("_.my_tag._")).toBe("my_tag");
    });

    test("throws error for empty or invalid tags", () => {
      expect(() => sanitizeTag("")).toThrow();
      expect(() => sanitizeTag("/")).toThrow();
      expect(() => sanitizeTag(":::")).toThrow();
    });

    test("prefixes Windows reserved device names case-insensitively", () => {
      expect(sanitizeTag("CON")).toBe("_CON");
      expect(sanitizeTag("con")).toBe("_con");
      expect(sanitizeTag("PRN")).toBe("_PRN");
      expect(sanitizeTag("AUX")).toBe("_AUX");
      expect(sanitizeTag("NUL")).toBe("_NUL");
      expect(sanitizeTag("COM1")).toBe("_COM1");
      expect(sanitizeTag("com9")).toBe("_com9");
      expect(sanitizeTag("LPT1")).toBe("_LPT1");
      expect(sanitizeTag("lpt9")).toBe("_lpt9");
    });

    test("does not prefix Windows reserved device names if they are part of a larger name", () => {
      expect(sanitizeTag("CONTENT")).toBe("CONTENT");
      expect(sanitizeTag("COM10")).toBe("COM10");
      expect(sanitizeTag("LPT")).toBe("LPT");
    });
  });

  describe("saveSnapshot", () => {
    test("writes successfully when file does not exist", () => {
      existsSpy.mockReturnValue(false);
      const data = { tag: "v1", env: "test" };

      saveSnapshot("v1", data);

      expect(writeSpy).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(data, null, 2)
      );
    });

    test("writes successfully when file exists and tag is the same", () => {
      existsSpy.mockReturnValue(true);
      readSpy.mockReturnValue(JSON.stringify({ tag: "v1", env: "old" }));
      const data = { tag: "v1", env: "test" };

      saveSnapshot("v1", data);

      expect(writeSpy).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(data, null, 2)
      );
    });

    test("throws collision error when file exists and tag is different", () => {
      existsSpy.mockReturnValue(true);
      readSpy.mockReturnValue(JSON.stringify({ tag: "v1-old", env: "old" }));
      const data = { tag: "v1-new", env: "test" };

      expect(() => saveSnapshot("v1-new", data)).toThrow(
        /Snapshot file collision/
      );
      expect(writeSpy).not.toHaveBeenCalled();
    });
  });

  describe("loadSnapshot", () => {
    test("loads successfully when file exists", () => {
      existsSpy.mockReturnValue(true);
      const mockData = { tag: "v1", data: "test" };
      readSpy.mockReturnValue(JSON.stringify(mockData));

      const result = loadSnapshot("v1");

      expect(result).toEqual(mockData);
    });

    test("logs error and exits process when file does not exist", () => {
      existsSpy.mockReturnValue(false);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit");
      });

      expect(() => loadSnapshot("v1")).toThrow("process.exit");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });

  describe("listSnapshots", () => {
    test("returns alphabetically sorted list of snapshot tags with .json removed", () => {
      readdirSpy.mockReturnValue([
        "c.json",
        "a.json",
        "b.json.json",
        "README.md", // Should be ignored
      ]);

      const result = listSnapshots();

      expect(result).toEqual(["a", "b.json", "c"]);
    });
  });
});
