Feature: User Creation
  As a user
  I want to test user creation
  So that I can verify the functionality works correctly

  Scenario: Successful User Registration
    Given I am on the registration page
    When I enter a valid username "testuser123"
    And I enter a valid email "testuser@example.com"
    And I enter a valid password "SecurePass123!"
    And I click the register button
    Then I should see a success message
    And I should be redirected to the dashboard
    And the user should be created in the database

  Scenario: Registration with Invalid Data
    Given I am on the registration page
    When I submit the form with empty fields
    Then I should see validation error messages
    And the form should not be submitted
