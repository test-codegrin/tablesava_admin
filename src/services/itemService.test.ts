import { describe, expect, it } from "vitest";
import { buildItemMultipartPayload } from "./itemService";

const createImageFile = (bytes: number, type = "image/png") =>
  new File([new Uint8Array(bytes)], "photo.png", { type });

describe("buildItemMultipartPayload", () => {
  it("builds multipart payload with required photo field key", () => {
    const payload = buildItemMultipartPayload({
      optionMode: "replace",
      payload: {
        name: "Paneer Tikka",
        description: "Smoky and spicy",
        price: 199,
        status: 1,
        photo: createImageFile(1024),
        option_groups: [
          {
            name: "Spice Level",
            required: false,
            min_select: 0,
            max_select: 1,
            options: [{ name: "Medium", price_delta: 0 }],
          },
        ],
      },
    });

    expect(payload.get("name")).toBe("Paneer Tikka");
    expect(payload.get("photo")).toBeInstanceOf(File);
    expect(payload.get("option_groups")).toBeTypeOf("string");
  });

  it("rejects non-image photo files", () => {
    const invalid = () =>
      buildItemMultipartPayload({
        optionMode: "replace",
        payload: {
          name: "Invalid",
          description: "",
          price: 10,
          status: 1,
          photo: createImageFile(1024, "text/plain"),
          option_groups: [
            {
              name: "Default",
              required: false,
              min_select: 0,
              max_select: 1,
              options: [{ name: "One", price_delta: 0 }],
            },
          ],
        },
      });

    expect(invalid).toThrow("image file");
  });

  it("rejects files larger than 5MB", () => {
    const invalid = () =>
      buildItemMultipartPayload({
        optionMode: "replace",
        payload: {
          name: "Large",
          description: "",
          price: 10,
          status: 1,
          photo: createImageFile(5 * 1024 * 1024 + 1),
          option_groups: [
            {
              name: "Default",
              required: false,
              min_select: 0,
              max_select: 1,
              options: [{ name: "One", price_delta: 0 }],
            },
          ],
        },
      });

    expect(invalid).toThrow("5MB");
  });
});

