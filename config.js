/**
 * ============================================================
 *  DATE NIGHT SIDE QUEST — EASY CONFIGURATION
 * ============================================================
 *  Edit the placeholders below before sending the link!
 */

window.QUEST_CONFIG = {
  // Recipient & deadline (local browser time: Dec 3, 2026 at 8:00 PM)
  recipientName: "Sanyukta",
  targetDateISO: "2026-12-03T20:00:00",
  targetLabel: "December 3rd • 8:00 PM",

  // Replace assets/sweater-1.png and assets/sweater-2.png with your own PNGs,
  // or change the image paths and place details below.
  quests: [
    {
      id: "quest-1",
      sweaterLabel: "Sweater #1",
      sweaterTag: "Calm & Cozy",
      sweaterImage: "assets/sweater-1.png",
      placeName: "Muro",
      vibeDescription: "Cozy, cute — watch me get lost in your eyes.",
      detailsUrl: "https://www.zomato.com/bangalore/muro-church-street-bangalore"
    },
    {
      id: "quest-2",
      sweaterLabel: "Sweater #2",
      sweaterTag: "Chaos",
      sweaterImage: "assets/sweater-2.png",
      placeName: "The Dual Room",
      vibeDescription: "cocktailsssssssssssssss!!!!!!!!",
      detailsUrl: "https://www.zomato.com/bangalore/the-dual-room-thippasandra-bangalore"
    }
  ],

  // ------------------------------------------------------------
  // EMAIL NOTIFICATION SETUP (Free, 30 seconds):
  //   1. Go to https://web3forms.com and enter your email to get a free Access Key.
  //   2. Paste it below. You'll get an instant email when she picks a quest or cancels!
  // ------------------------------------------------------------
  notifications: {
    web3formsAccessKey: "a7fe6461-c1b9-4e30-b19f-dc53743e9134"
  }
};

