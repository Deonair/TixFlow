describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
});

it('TixFlow Register', function() {
     cy.visit('http://localhost:5173/')
     cy.get('#root a[href="/register"]').click();
     cy.get('[name="name"]').click();
     cy.get('[name="name"]').type('Tester Test');
     cy.get('[name="email"]').click();
     cy.get('[name="email"]').type('test@tixflow.nl');
     cy.get('[name="organization"]').click();
     cy.get('[name="organization"]').type('TixFlow');
     cy.get('[name="password"]').click();
     cy.get('[name="password"]').type('Test123#');
     cy.get('[name="confirm"]').click();
     cy.get('[name="confirm"]').type('Test123#');
     cy.get('#root button.w-full').click();
     
});

it('TixFlow Login', function() {
     cy.visit('http://localhost:5173/')
     cy.get('#root a[href="/login"]').click();
     cy.get('#email').click();
     cy.get('#email').type('T');
     cy.get('#password').click();
     cy.get('#password').type('Test123#');
     cy.get('#root button.w-full').click();
     
});