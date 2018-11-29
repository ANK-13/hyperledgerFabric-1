/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getParticipantRegistry */

/**
 * Close the bidding for a vehicle listing and choose the
 * highest bid that is over the asking price
 * @param {org.acme.tender.CloseBidding} closeBidding - the closeBidding transaction
 * @transaction
 */
async function CloseBidding(closeBidding) {  // eslint-disable-line no-unused-vars
    const listing = closeBidding.tListing;
    if (listing.state !== 'OPEN') {
        throw new Error('Sorry tender is not open');
    }
    // by default we mark the listing as RESERVE_NOT_MET
    listing.state = 'CLOSED';
    let highestOffer = null;
    let bidder = null;
  
    if (listing.offers && listing.offers.length > 0) {
        // sort the bids by bidPrice
        listing.offers.sort(function(a, b) {
            return (a.bidPrice - b.bidPrice);
        });
        highestOffer = listing.offers[0];
        if (highestOffer.bidPrice >= listing.reservePrice) {
            // mark the listing as SOLD
            listing.state = 'CLOSED';
            bidder = highestOffer.bidder;
        
            // update the balance of the seller
            
            bidder.balance -= highestOffer.bidPrice;
            
            listing.bidder = bidder;
            
        }
    }

    

    // save the tender listing
    const tenderListingRegistry = await getAssetRegistry('org.acme.tender.TenderListing');
    await tenderListingRegistry.update(listing);

    if (listing.state === 'CLOSED') {
     
        // save the buyer
      if (!bidder.tenders) {
        bidder.tenders = [];
    }
      bidder.tenders.push(listing.listingId);
        const userRegistry = await getParticipantRegistry('org.acme.tender.Bidder');
        await userRegistry.update(bidder);
    }
}

/**
 * Make an Offer fo
 * @param {org.acme.tender.Bid} tenders - the offer
 * @transaction
 */
async function Bid(offer) {  // eslint-disable-line no-unused-vars
    let listing = offer.tListing;
    if (listing.state !== 'OPEN') {
        throw new Error('Sorry, Tender is not yet open');
    }
    if (!listing.offers) {
        listing.offers = [];
    }
    listing.offers.push(offer);

    // save the tender listing
    const tenderListingRegistry = await getAssetRegistry('org.acme.tender.TenderListing');
    await tenderListingRegistry.update(listing);
}
