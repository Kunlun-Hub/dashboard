describe("Click all tabs in peer modal", () => {
  it("passes", () => {
    cy.intercept("GET", "**/api/instance/branding", {
      statusCode: 200,
      body: {},
    });

    cy.visit("/install");
    cy.contains('[role="tab"]', "Linux").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
    cy.contains('[role="tab"]', "Windows").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
    cy.contains('[role="tab"]', "Android").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
    cy.contains('[role="tab"]', "Docker").click();
    cy.get("[data-cy=copy-to-clipboard]:visible").first().click();
  });
});
