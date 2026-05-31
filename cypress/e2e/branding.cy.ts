const brandLogo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const brandIcon =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AARQAByAG4H5QAAAABJRU5ErkJggg==";

const branding = {
  branding_logo_data_url: brandLogo,
  branding_icon_data_url: brandIcon,
  branding_tab_title: "Acme Portal",
  branding_primary_color: "#123456",
};

function mockPublicBranding() {
  cy.intercept("GET", "**/api/instance/branding", {
    statusCode: 200,
    body: branding,
  }).as("branding");
}

function mockInstanceStatus(setupRequired: boolean) {
  cy.intercept("GET", "**/api/instance", {
    statusCode: 200,
    body: { setup_required: setupRequired },
  }).as("instanceStatus");
}

function expectPublicBranding(pageTitle: string) {
  cy.wait("@branding");
  cy.title().should("eq", `${pageTitle} - Acme Portal`);
  cy.get('img[alt="Acme Portal Logo"]')
    .first()
    .should("have.attr", "src", brandLogo);
  cy.get('link[rel="icon"]').should("have.attr", "href", brandIcon);
  cy.document().then((doc) => {
    expect(
      doc.documentElement.style.getPropertyValue("--cloink-brand-400"),
    ).to.equal("18 52 86");
  });
}

describe("Public branding", () => {
  it("applies custom branding on the install page", () => {
    mockPublicBranding();

    cy.visit("/install");

    expectPublicBranding("Installation");
  });

  it("applies custom branding on the setup page", () => {
    mockPublicBranding();
    mockInstanceStatus(true);

    cy.visit("/setup");
    cy.wait("@instanceStatus");

    expectPublicBranding("Instance Setup");
  });

  it("applies custom branding on the invite page", () => {
    mockPublicBranding();
    mockInstanceStatus(false);
    cy.intercept("GET", "**/api/users/invites/brand-token", {
      statusCode: 200,
      body: {
        email: "alice@example.com",
        name: "Alice Example",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        valid: true,
      },
    }).as("invite");

    cy.visit("/invite?token=brand-token");
    cy.wait(["@instanceStatus", "@invite"]);

    expectPublicBranding("Accept Invite");
  });
});
