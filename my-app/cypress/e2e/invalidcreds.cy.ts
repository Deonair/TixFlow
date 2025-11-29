describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
});

it('invalidcreds', function() {
     cy.visit('http://localhost:5173')
     cy.get('#root a[href="/login"]').click();
     cy.get('#email').click();
     cy.get('#email').type('Test@test.nl');
     cy.get('#password').click();
     cy.get('#password').type('Test123');
     cy.get('#root button.w-full').click();
     cy.get('#password').click();
     cy.get('#password').clear();
     cy.get('html').click();
     cy.get('#root button.w-full').click();
     cy.get('#email').click();
     cy.get('#email').clear();
     cy.get('#root button.w-full').click();
     
});