import { describe, expect, it } from "vitest";

import {
  buildInvitationAcceptUrl,
  renderInvitationEmail,
} from "./invitations.email";

describe("buildInvitationAcceptUrl", () => {
  it("constructs the back-office accept link with an encoded token", () => {
    expect(
      buildInvitationAcceptUrl({
        backOfficeUrl: "https://staff.example.com",
        token: "token with spaces&symbols",
      })
    ).toBe(
      "https://staff.example.com/invitations/accept?token=token+with+spaces%26symbols"
    );
  });
});

describe("renderInvitationEmail", () => {
  it("renders the invitation email with escaped dynamic values", () => {
    const message = renderInvitationEmail({
      name: 'Ari <Admin> "One"',
      acceptUrl:
        "https://staff.example.com/invitations/accept?token=a&next=<x>",
    });

    expect(message.subject).toBe("You've been invited to Srinil Stay");
    expect(message.html).toContain("Hi Ari &lt;Admin&gt; &quot;One&quot;");
    expect(message.html).toContain(
      'href="https://staff.example.com/invitations/accept?token=a&amp;next=&lt;x&gt;"'
    );
  });
});
