// Original brokerage copy. Delays are measured from the preceding step.
export const DEFAULT_CAMPAIGNS = [
  {
    key: 'buyer-welcome', name: 'Buyer • Welcome and home search', leadType: 'BUYER', duration: 30,
    description: 'A month of buyer introductions, financing preparation, and search check-ins.', scope: 'COMPANY',
    steps: [
      { id: 'welcome', type: 'EMAIL', delayValue: 0, delayUnit: 'DAY', subject: 'Let’s plan your home search', content: 'Thanks for connecting with our team. What areas, price range, and move-in timeline do you have in mind? Reply with your priorities so we can help you plan your next steps.' },
      { id: 'financing', type: 'EMAIL', delayValue: 3, delayUnit: 'DAY', subject: 'Preparing for your home purchase', content: 'A financing conversation can help clarify your budget before touring homes. Have you spoken with a lender about pre-approval? We can also discuss cash purchase preparation and your preferred monthly housing costs.' },
      { id: 'search', type: 'CALL', delayValue: 4, delayUnit: 'DAY', content: 'Call the buyer to confirm search criteria, financing readiness, and preferred showing times.' },
      { id: 'checkin', type: 'EMAIL', delayValue: 23, delayUnit: 'DAY', subject: 'How is your home search progressing?', content: 'Have your preferences or timing changed? Tell us what you like, what you would change, and whether you would like to schedule a buyer consultation.' },
    ],
  },
  {
    key: 'seller-welcome', name: 'Seller • Listing preparation', leadType: 'SELLER', duration: 30,
    description: 'Seller consultation, pricing preparation, and a listing readiness follow-up.', scope: 'COMPANY',
    steps: [
      { id: 'welcome', type: 'EMAIL', delayValue: 0, delayUnit: 'DAY', subject: 'Planning your home sale', content: 'Thank you for considering our team. What is your ideal selling timeline, and what questions would you like us to address? We can arrange a consultation to discuss your goals and the local market.' },
      { id: 'pricing', type: 'CALL', delayValue: 2, delayUnit: 'DAY', content: 'Arrange a seller consultation and prepare a comparative market analysis using current local sales.' },
      { id: 'preparation', type: 'EMAIL', delayValue: 5, delayUnit: 'DAY', subject: 'Getting ready to list', content: 'Before spending on repairs, let’s review your property together. We can prioritize presentation, maintenance, and the documents needed for your listing based on your budget and timeline.' },
      { id: 'checkin', type: 'EMAIL', delayValue: 23, delayUnit: 'DAY', subject: 'Checking in on your selling plans', content: 'Are you still considering a move? Reply with any changes to your plans, or let us know when you would like to review pricing and next steps.' },
    ],
  },
  ...(['BUYER', 'SELLER'] as const).map((leadType) => ({
    key: `${leadType.toLowerCase()}-long-term`, name: `${leadType === 'BUYER' ? 'Buyer' : 'Seller'} • Two-year nurture`,
    leadType, duration: 730, scope: 'COMPANY',
    description: 'Quarterly, monthly, and annual follow-ups for a longer moving timeline. Shared with every agent in your brokerage workspace.',
    steps: [
      { id: 'initial', type: 'EMAIL', delayValue: 1, delayUnit: 'DAY', subject: 'Planning ahead for your next move', content: 'Even if your move is some time away, we can help you prepare. What timeline are you considering, and what would be most helpful as you plan?' },
      { id: 'quarter', type: 'EMAIL', delayValue: 3, delayUnit: 'MONTH', subject: 'A check-in on your moving plans', content: 'Has anything changed with your plans? If you would like a current local market review or help preparing for your move, reply and we can arrange a conversation.' },
      { id: 'half', type: 'TASK', delayValue: 3, delayUnit: 'MONTH', content: 'Review this contact’s timeline and prepare a personalized local market update.' },
      { id: 'annual', type: 'EMAIL', delayValue: 6, delayUnit: 'MONTH', subject: 'Looking ahead to the coming year', content: 'Are you thinking about a move in the coming year? Let us know your current goals so we can help you plan at a comfortable pace.' },
      { id: 'second-year', type: 'EMAIL', delayValue: 1, delayUnit: 'YEAR', subject: 'Is a move on your horizon?', content: 'We are checking in to see whether your real estate plans have changed. Reply whenever you would like help reviewing your options or updating your moving timeline.' },
    ],
  })),
];
