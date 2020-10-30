
// ----------------------------------------------------------
// Functions to re-use
// ----------------------------------------------------------

// Remove class
function removeClass (elem, removeClass) {
  return elem.classList.remove(removeClass);
}

// Add class
function addClass (elem, addClass) {
  return elem.classList.add(addClass);
}

// Insert after element
function insertAfter(newNode, existingNode) {
  existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

// Remove all children
function removeChildren (section) {
  if (section.hasChildNodes()) {
    while (section.firstChild) {
      section.removeChild(section.firstChild);
    }
  }
}

// Remove all but certain children 
function removeNthChild (section, child1, child2) {
  const itemChildren = section.children;
  if (itemChildren.length > child1) {
    while(itemChildren.item(child2)) {
      section.removeChild(itemChildren.item(child2))
    }
  }
}

// Create the type of element you pass in the parameters
function createNode(element) {
  return document.createElement(element);
}

// Append the second parameter(element) to the first one
function append(parent, el) {
  return parent.appendChild(el);
}

// Toggle between the show and hide class
function toggle (elem, hideClass, showClass) {
  if (elem.classList.contains(hideClass)) {
    elem.classList.remove(hideClass);
    elem.classList.add(showClass);
  } else {
    elem.classList.add(hideClass);
    elem.classList.remove(showClass);
  }
}

// Function to make the lists for the bills
// ** TODO: add if statements for if item is empty **
function makeBillsList (array, sectionClass, listClass) {
  return array.map(function (bill) {
    const billsListItem = createNode('li');
    addClass(billsListItem, listClass);

    const title = createNode('p');
    addClass(title, 'bill__title');
    title.innerText = bill.title;

    const subject = createNode('p');
    addClass(subject, 'bill__subject');
    subject.innerText = bill.subject;

    const link = createNode('a');
    addClass(link, 'bill__find-out-more');
    link.innerText = 'Learn more about this bill';
    link.setAttribute('href', bill.link);

    append(sectionClass, billsListItem);
    append(billsListItem, subject);
    append(billsListItem, title);
    append(billsListItem, link);
  });
}

// Add click and toggle event to lists
function addBillsClickEvent (triggerClass) {
  const triggers = document.querySelectorAll(triggerClass);
  for(var i = 0; i < triggers.length; i++){ 
    triggers[i].addEventListener('click', function(e){
      let bills = e.target.closest('.js-bills-wrapper');
      let billsList = bills.querySelector('.bills__list');
      toggle(billsList, 'js-hide', 'js-show');
    });
  }
}


document.addEventListener("DOMContentLoaded", function () {

  addBillsClickEvent('.js-toggle');

  // If search button for senators is hit, initialize Congress Search
  const search = document.querySelector('.js-search-senator');
  search.addEventListener('click', initCongressSearch);

  const reelection = document.querySelector('.js-reelection-year');
  reelection.addEventListener('click', initReelectionSearch);

});

// Variables
const senateMembersURL = 'https://api.propublica.org/congress/v1/116/senate/members.json';
const APIkey = "vdrdO2U515LrtFSSE7YrQbIir6SahKj3098eEEiS";

const apiObject = {
  method: "GET",
  headers: {
    "X-API-Key": APIkey
  }
}

// ----------------------------------------------------------
// Congress Info Search
// ----------------------------------------------------------

// Get congress members from ProPublica API
async function fetchCongressMembersJSON() {
  const response = await fetch(senateMembersURL, apiObject, true);
  
  if (response.status !== 200) {
    alert('There was an error');
    return;
  }

  const senateMems = await response.json();
  return senateMems;
}


// Get bill information from specific congress members
async function fetchSenatorBillsJSON(url) {
  try {
    const response = await fetch(url, apiObject, true);
    if (response.status !== 200) {
      alert('There was an error');
      return;
    }
    return response.json();
  } catch (err) {
    console.log(err, "bill search");
  }
}

const initCongressSearch = () => {
  const input = document.querySelector('.js-input-name');
  const searchTerm = input.value;
  const results = document.querySelector('.js-results-senator');
  const resultSection = document.querySelectorAll('.js-result-wrapper');
  const noResults = document.querySelector('.js-no-results');
  const billsPassedSection = document.querySelector('.js-bills-passed');
  const billSecIntro = document.querySelector('.js-bills-introduced');
  let members;

  // If search input is empty - alert please enter a value and stop the rest of the function
  if (searchTerm.length === 0) {
    alert('Please Enter a Value');
    return;
  }

  fetchCongressMembersJSON().then((data) => {

    // Get results from api and store data
    members = data.results[0].members;

    // Create object for result names that match, this starts empty each time
    let nameResults = {
      noEntry: true,
    };

    // Store members that match search in an option
    // **** TODO: Add option for if they put first and lastname together ****
    members.forEach((i) => {
      if (searchTerm.toLowerCase() ===  i.last_name.toLowerCase() || searchTerm.toLowerCase() === i.first_name.toLowerCase()) {
        nameResults.firstName = i.first_name;
        nameResults.lastName = i.last_name;
        nameResults.nextElection = i.next_election;
        nameResults.state = i.state;
        nameResults.id = i.id;
        nameResults.noEntry = false;
        nameResults.bills = {};
        nameResults.bills.passed = {};
        nameResults.bills.introduced = {};
      }
    });

    // Check if no entry is true - if true then show the text for no results and stop the function
    if (nameResults.noEntry) {
      removeClass(results, 'js-hide');
      addClass(results, 'js-show');
      addClass(noResults, 'js-show');
      resultSection.forEach((i) => {
        if (i.classList.contains('js-show')) {
          removeClass(i, 'js-show');
          addClass(i, 'js-hide');
        }
      });
      return;
    }

    // If there is an entry use the id to get bills API url
    const billsPassedURL = `https://api.propublica.org/congress/v1/members/${nameResults.id}/bills/passed.json`;
    const billsIntroducedURL = `https://api.propublica.org/congress/v1/members/${nameResults.id}/bills/introduced.json`;

    // Get information from API
    let billsPassed = fetchSenatorBillsJSON(billsPassedURL);
    let billsIntroduced = fetchSenatorBillsJSON(billsIntroducedURL);

    // If we do have name match (noentry is false) and the noresults text is showing from a previous search remove the show class from this section
    if (noResults.classList.contains('js-show')) { 
      removeClass(noResults, 'js-show'); 
    }

    // Match all the senator info to the right place 
    const senatorName = document.querySelector('.results__name');
    const senatorState = document.querySelector('.results__state');
    const senatorTermEnd = document.querySelector('.results__nextElection');
          
    senatorName.innerText = `${nameResults.firstName} ${nameResults.lastName}`;
    senatorState.innerText = nameResults.state;
    senatorTermEnd.innerText = nameResults.nextElection;

    // Then show the results section
    removeClass(results, 'js-hide');
    addClass(results, 'js-show');

    resultSection.forEach((i) => {
      addClass(i, 'js-show');
      removeClass(i, 'js-hide');
    });
    
    // Fetch bill information from api
    Promise.all([billsPassed,billsIntroduced]).then( values => {
      let passedBills = values[0].results[0].bills;
      let introducedBills = values[1].results[0].bills;
  
      // Add info needed to name object
      passedBills.forEach((key, value) => {
        let item = {
          title: key.short_title,
          link: key.govtrack_url,
          subject: key.primary_subject,
        };
        nameResults.bills.passed[value] = item;
      });

      introducedBills.forEach((key, value) => {
        let item = {
          title: key.short_title,
          link: key.govtrack_url,
          subject: key.primary_subject
        };
        nameResults.bills.introduced[value] = item;
      });

      // Store bills objects as an array of values
      const billsPass = Object.values(nameResults.bills.passed);
      const billsIntroduced = Object.values(nameResults.bills.introduced);

      // Remove children if they are there from previous search
      removeChildren(billsPassedSection);
      removeChildren(billSecIntro);

      // If bills array is empty then show results for no bills
      if (!billsPass.length > 0) {
        const noBills = createNode('p');
        addClass(noBills, 'no-bills');
        noBills.innerText = "Currently no bills passed";
        append(billsPassedSection, noBills);
      }

      if (!billsIntroduced.length > 0) {
        const noBills = createNode('p');
        addClass(noBills, 'no-bills');
        noBills.innerText = "Currently no bills passed";
        append(billSecIntro, noBills);
      }
      
      // Make a ul list with bill information
      makeBillsList(billsPass, billsPassedSection, 'bills__list--item');
      makeBillsList(billsIntroduced, billSecIntro, 'bills__list--item');
    });
  }).catch ((err) => {
    console.log(err, 'member info search');
  });
}

// ----------------------------------------------------------
// re-Election Info Search
// ----------------------------------------------------------

const initReelectionSearch = () => {
  const input = document.querySelector('.js-input-year');
  const yearSelection = input.options[input.selectedIndex].text;
  const noResultsText = document.querySelector('.results__reelection .js-no-results');
  const labels = document.querySelector('.results__reelection--grid');
  const resultHolder = document.querySelector('.results__reelection');
  let members;

  fetchCongressMembersJSON().then((data) => {
    // Store data
    members = data.results[0].members;

    // If selection is not a number - alert to select a value
    if (!Number(yearSelection)) {
      alert('Please select a value');
      return;
    }
    
    // Remove results if they are already there
    removeNthChild(resultHolder, 2, 2);
   
    // Store names that match in a new object
    let names = {}
    names = members.filter(member => member.next_election === yearSelection);

    // If there are no names then show the no results text and hide labels
    if (names.length === 0) {
      addClass(resultHolder, 'js-show');
      removeClass(resultHolder, 'js-hide');
      addClass(noResultsText, 'js-show');
      if (!labels.classList.contains('js-hide')) {
        addClass(labels, 'js-hide');
        removeClass(labels, 'js-show-grid');
      }
      return;
    }
    
    // Remove no results text (if shown from previous search)
    if (noResultsText.classList.contains('js-show')) {
      removeClass(noResultsText, 'js-show');
      addClass(noResultsText, 'js-hide');
    }

    // Show labels if hidden
    if (labels.classList.contains('js-hide')) {
      removeClass(labels, 'js-hide');
      addClass(labels, 'js-show-grid');
    }
    
    // Get properties needed for name
    names.forEach((key, value) => {
      let name = {
        fullName: key.first_name + ' ' + key.last_name,
        party: key.party,
        state: key.state
      };
      names[value] = name;
    });
    
    // Add names to proper section
    names.forEach((i) => {
      addClass(resultHolder, 'js-show');
      removeClass(resultHolder, 'js-hide');
      const section = createNode('div');
      addClass(section, 'results__reelection--grid');
      addClass(section, 'js-show-grid');
      const fullName = createNode('p');
      const state = createNode('p');
      const party = createNode('p');
      addClass(state, 'results__state');
      addClass(fullName, 'results__name');
      addClass(party, 'results__party');
      fullName.innerText = i.fullName;
      state.innerText = i.state;
      insertAfter(section, labels);
      append(section, fullName);
      append(section, state);
      append(section, party);

      if (i.party === 'R') {
        party.innerText = "Republican";
        addClass(party, 'republican');
        return;
      }

      if (i.party === 'D') {
        party.innerText = "Democrat";
        addClass(party, 'democrat');
        return;
      }

      if (i.party === 'ID') {
        party.innerText = "Independant";
        addClass(party, 'independant');
        return;
      }

      party.innerText = i.party;

    });
    
  }).catch ((err) => {
      console.log(err, 're-election');
  });
}