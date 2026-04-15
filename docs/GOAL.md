Single page for property financing. 

Goals:
* Calculates financing capabilities to buy a property in Switzerland: 
* Shows, over time,  what happens if you put more or less cash into the property compared with a fixed % of earnigns (on an ETF)
  * how much money you loose over time into interest payments
* Shows wealth tax per Kanton over time.

Inputs needed:
* Property value
* Own cash to put in advance
* Loan interest rate
* Yearly income
* Market interest rate to apply to the money you are not putting into the loan.
* Initial total wealth (that will be used to put the own cash)
* Expected price gains on the property in % per year
* Kanton to calculate wealth tax (let's start with zurich for v1, we have the calculations as static function)

Static/Internal inputs:
* 1% of the property value in maintenance and property costs
* 5% interest rate to calculate the affordability. This plus maintenance costs should not be over 33%
* Kantonal wealth tax formulas.

Outputs:
* Is the property affordable
* monthly payments: interest and expenses
* max affordable property price
* Property price over time
* Money spent in interest

Notes:
* No amortization needed in Switzerland
* Wealth tax is calculated on net wealth: what you have minus what you owe.
* Minimum downpayment 33%
* There is an extra loan if the downpayment goes from 20% till 33% that needs to be repaid. We are not implementing this feature.
* Put a graph for 20 years
* Interests remain constant for the future (we don't know it)

Software stack
* Single page HTML with local storage.
* Alpine JS
* Tailwind CSS
* Chart JS
