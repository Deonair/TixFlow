describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })
});

it('Invalid Login Credentials', function() {
     cy.visit('https://tixflow.nl/')
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

it('Invalid Payment Credentials', function() {
  cy.visit('https://tixflow.nl//kerstdiner')
  
  cy.get('#root button.text-gray-700').click();
  cy.get('#root button[aria-label="Verhoog aantal"]').click();
  cy.get('#root button.w-full').click();
  cy.get('#firstName').click();
  cy.get('#firstName').type('Jeff@');
  cy.get('#lastName').click();
  cy.get('#lastName').type('A');
  cy.get('#email').click();
  cy.get('#lastName').click();
  cy.get('#lastName').type('.');
  cy.get('#email').click();
  cy.get('#email').type('Test@.co');
  cy.get('#root button.text-white').click();
  cy.get('#email').type('m');
  cy.get('#root button.text-white').click();
  cy.get('#email').click();
  cy.get('#email').clear();
  cy.get('#email').type('Test@ll.com');
  cy.get('#root button.text-white').click();
  
});

it('Invalid Event Form Credentials', function() {
  cy.visit('https://tixflow.nl/')
  
  cy.get('#root a[href="/login"]').click();
  cy.get('#email').click();
  cy.get('#email').type('chris@tixflow.nl');
  cy.get('#password').type('test123#');
  cy.get('#root button.w-full').click();
  cy.get('#root button.px-3').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').type('@@');
  cy.get('[name="location"]').click();
  cy.get('[name="location"]').type('Test Not Existing ST 13009');
  cy.get('#root button.text-white').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').clear();
  cy.get('[name="date"]').click();
  cy.get('[name="date"]').type('2025-12-16');
  cy.get('#root button.text-white').click();
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').type('@@');
  cy.get('#root button.text-white').click();
  
});