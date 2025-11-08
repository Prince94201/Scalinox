# 🎨 Scalineous: AI-Powered Art Generation & Web3 Creator Marketplace

**Project URL:** `[LINK TO YOUR DEVPOST/GITHUB REPO]`

**Video Demo:** `[LINK TO YOUR YOUTUBE/VIMEO DEMO]`

**Hackathon:** Built for Hack CBS 8.0

## 1. The Problem: The Creative Bottleneck

Digital art creation has a high barrier to entry. While many people have creative ideas, turning a simple sketch into a polished, high-quality piece of art or animation requires technical skill, expensive software, and time. Existing AI art tools offer a solution but often impose restrictive guardrails, operate as black boxes, and offer limited creative freedom.

How can we empower everyday users to bring their most imaginative visions to life, while also building a new economy for the digital artists who create the tools?

## 2. Our Solution: A Dual Ecosystem

**Scalineous** is a web-based creative suite and a two-sided marketplace that bridges the gap between imagination and creation.

* **For Creators:** An intuitive canvas where users sketch ideas. Our AI, powered by **Gemini**, transforms those sketches into stunning artwork and animations.
* **For Artists & Developers:** A decentralized Web3 marketplace on **Solana** where artists can:
    * **Sell Collaborative Effects:** Design, mint, and sell their unique "animation effects" as NFTs.
    * **Earn Royalties:** Get paid when other users buy and apply these effects to their own creations.
    * **Get Hired:** Take on gig work from creators who need custom art, with payments handled on-chain.

## 3. How It Works: The Tech Stack

Our application uses a modern, full-stack architecture designed to leverage the powerful technologies of the Hack CBS 8.0 sponsors.

* **Frontend**: A responsive Next.js application with React and Tailwind CSS.
* **Backend**: Hosted on **AWS**, our backend orchestrates all AI and database logic.
* **Authentication**: Secured by **Auth0** for safe, seamless user login.
* **Database**: **MongoDB** stores all user data, project files, and non-chain marketplace metadata.
* **Blockchain**: We use the **Solana** network for our custom smart contracts, handling all NFT minting and marketplace payments.
* **API Testing**: All 20+ endpoints are rigorously tested using the **Qyrus qAPI** codeless testing platform to ensure 100% reliability.

## 4. Key Features

* **Intuitive Drawing Toolkit**: A fully-featured canvas (paintbrush, eraser, color picker) to capture your ideas. You can import existing images or export your final creations.
* **Agentic AI Art Generation**: An AI flow that intelligently interprets user sketches and prompts (using **Gemini**) to generate high-quality images and animations. It operates in two modes:
    * **AI Styles**: Select from curated styles (Cyberpunk, Anime, Fantasy) to instantly transform your sketch.
    * **Dream-Mode**: Describe a unique vision with a custom text prompt, giving you complete control.
* **AI-Powered Prompt Refinement**: To enhance creative control, we have integrated **OpenRouter**, which gives us access to a 120-billion parameter open-source AI model. This dedicated agent takes a user's simple idea and fleshes it out into a more descriptive and evocative prompt, maximizing the quality of the generated art.
* **Decentralized Creator Marketplace**: A dual-function marketplace built on **Solana**:
    * **Open Collaboration Marketplace**: This is the core of our economy. Artists can collaborate by designing, minting, and selling their unique "animation effects" as NFTs on **Solana**. Other users can then buy these effects, apply them to their own artwork, and create new, remixed art, with the original artist earning a commission on every sale.
    * **Gig Marketplace**: Clients can post design jobs with budgets specified in SOL or USDC. Our smart contract handles designer registration and secure payments.
    * **Wallet Integration**: Securely connect your **MetaMask** or Phantom wallet to interact with the marketplace.

## 5. Tech Stack & Hack CBS 8.0 Tracks

This project was built to strategically align with the Hack CBS 8.0 sponsors.

| Technology | Use Case | Hack CBS 8.0 Track |
| :--- | :--- | :--- |
| **Qyrus qAPI** | **(Tech Partner)** Used to create a full regression suite for all internal and external API endpoints. | **Qyrus Track (Ray-Ban Glasses)** |
| **AWS** | **(Sponsor)** Hosts our entire full-stack application (backend, AI logic) and media storage (S3). | **Remarkable Integration of AWS** |
| **Solana** | **(Sponsor Tech)** Powers the entire Web3 marketplace, including NFT minting, asset sales, and gig payments.<br/>*Note: The "Open Collaboration Marketplace" is a key part of our Solana integration.* | **Best Blockchain Innovation** |
| **Gemini / OpenRouter** | **(Sponsor Tech)** We use **Gemini** for image generation and **OpenRouter** for AI prompt refinement. | **Best Use of GenAI** |
| **Auth0** | **(Sponsor)** Provides secure, seamless user authentication for both creators and artists. | **General Sponsor Track** |
| **MongoDB** | **(Sponsor)** Our primary database for all user data, project files, and marketplace metadata. | **General Sponsor Track** |

## 6. Future Scope

* **Advanced Marketplace Features**: Implement a rating system, milestone-based payments, and a dispute resolution mechanism.
* **Token-Gated Access**: Introduce special features or exclusive styles for users holding a "Scalineous" NFT.
* **Community Hub**: Build a gallery where users can share their creations, follow their favorite artists, and participate in creative challenges.

## 7. Meet the Team

* Bhavya Pratap Singh Tomar
* Prince Agrawal
* Bhavya Madan
* Piyush Ojha

