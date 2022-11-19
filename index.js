// Import Solana web3 functinalities
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmRawTransaction,
    sendAndConfirmTransaction
} = require("@solana/web3.js");

const DEMO_FROM_SECRET_KEY = new Uint8Array(
    [
       169,   0,  18, 152,  71, 149,  21,  41, 219, 213,  81,
       64, 140, 208, 147, 212, 178, 142,  32, 242, 104,  62,
        0, 100, 134, 107, 145, 128,  92, 247, 107,  59, 207,
      217, 137, 156, 214, 195, 130,  41,  98, 242,  70, 250,
      233, 209,  14,  17,  56, 173,  44, 153,  67,  68,   0,
      198,  80, 148, 203,  23, 180,  47, 213, 252
    ]            
);

var fromWalletBalance;

//Sleep function definition
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Get Keypair from Secret Key
const from = Keypair.fromSecretKey(DEMO_FROM_SECRET_KEY);
    
// Generate another Keypair (account we'll be sending to)
const to = Keypair.generate();

const airdropSol = async() => {

  try {

    //const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Connecting to specific devnet IP as a workaround for JSON RPC Internal Error when attempting to Airdrop Sol
    const connection = new Connection('http://139.178.65.155', "confirmed");

    // From Wallet Balance check
    fromWalletBalance = await connection.getBalance(
      from.publicKey
    );

    console.log(`Initial Balance of Sender Wallet: ${parseInt(fromWalletBalance) / LAMPORTS_PER_SOL} SOL`);

    if ( (fromWalletBalance/2) < 2 ) {

      // Aidrop 2 SOL to Sender wallet
      console.log("Airdopping some SOL to Sender wallet!");
      const fromAirDropSignature = await connection.requestAirdrop(
          from.publicKey,
          2 * LAMPORTS_PER_SOL
      );

      // Latest blockhash (unique identifer of the block) of the cluster
      let latestBlockHash = await connection.getLatestBlockhash();

      // Confirm transaction using the last valid block height (refers to its time)
      // to check for transaction expiration
      await connection.confirmTransaction({
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: fromAirDropSignature
      });

      console.log("Airdrop completed for the Sender account");

      fromWalletBalance = await connection.getBalance(
        from.publicKey
      );

      console.log(`Balance of Sender Wallet after Airdrop: ${parseInt(fromWalletBalance) / LAMPORTS_PER_SOL} SOL`);

    }
    else {
      console.log("Airdrop not requred since the From Wallet has sufficient balance of at least 2 SOLs.");
    }

  }

  catch(err) {
    console.log(err);
  }

}

const transferSol = async() => {

  try {

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
    // Connecting to specific devnet IP as a workaround for JSON RPC Internal Error
    //const connection = new Connection('http://139.178.65.155', "confirmed");

    console.log("Pausing for 30 sec before executing the next transaction");

    //Attempting next transaction after 30 sec pause to resolve Too many Transactions error

    await sleep(30000).then(() => {
       console.log("Initiating transfer of 50% balance from Sender to Receiver Wallet");
       });

    // Send money from "from" wallet and into "to" wallet
    var transaction = new Transaction().add(
      SystemProgram.transfer({
           fromPubkey: from.publicKey,
           toPubkey: to.publicKey,
           lamports: fromWalletBalance * 0.5
        })
    );

   // Sign transaction
   var signature = await sendAndConfirmTransaction(
       connection,
       transaction,
       [from]
   );
   console.log('Signature of the transfer Transaction is ', signature);

  fromWalletBalance = await connection.getBalance(
     from.publicKey
   );
 
   console.log(`Balance of Sender Wallet after the transfer Transaction: ${parseInt(fromWalletBalance) / LAMPORTS_PER_SOL} SOL`);

   const toWalletBalance = await connection.getBalance(
     to.publicKey
   );
 
   console.log(`Balance of Receiver Wallet after the transfer Transaction: ${parseInt(toWalletBalance) / LAMPORTS_PER_SOL} SOL`);

  }

  catch(err) {
    console.log(err);
  }

}

//Separated Airdrop Sol & Transfer Sol process to fix Too many requests for same RPC Call error
main = async() => {
  await airdropSol();
  await transferSol();
}

main();
