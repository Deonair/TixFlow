describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
});

it('Account', function() {
  cy.visit('http://localhost:5173/event/final-quarter-zip-event')
  cy.get('#root button.text-gray-700').click();
  cy.get('#root button.w-full').click();
  cy.get('#firstName').click();
  cy.get('#firstName').type('Obed');
  cy.get('#lastName').click();
  cy.get('#lastName').type('Attire');
  cy.get('#email').click();
  cy.get('#email').type('Attireseason');
  cy.get('#root button.text-white').click();
  cy.get('#root button.text-white').click();
  
});