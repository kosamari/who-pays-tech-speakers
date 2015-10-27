function checkSingular(num, unit){
  var singular = {
    years:'year',
    minutes:'minute',
    hours:'hour',
    days:'day'
  };
  if(num<=1){
    return singular[unit];
  }
  return unit;
}

function location(loc){
  if(loc){
    return ' in '+loc + '.';
  }
  return '.';
}
function eventDetail(inviteType,talkType,eventName,eventLocation){
  var invite = {
    invited:'invited',
    cfp:'selected from CFP',
    sponsored:'sponsored'
  };
  var type = {
    talk:'to speak',
    panel:'to be on a panel',
    workshop:'to give a workshop'
  };
  var type2 ={
    talk:'I gave a talk',
    panel:'I was on a panel',
    workshop:'I run a workshop'
  };
  if(inviteType && talkType && eventName){
    return 'I was ' +invite[inviteType]+' '+ type[talkType] +' at '+ eventName + location(eventLocation);
  }else if(!inviteType && talkType&& eventName){
    return  type2[talkType]+' at '+ eventName + location(eventLocation);
  }else if(!inviteType && !talkType && eventName){
    return 'I spoke at ' + eventName + location(eventLocation);
  }else if(!inviteType && talkType && !eventName){
    return type2[talkType] + location(eventLocation);
  }else if(inviteType && talkType && !eventName){
    return 'I was '+invite[inviteType]+'  '+type[talkType] + location(eventLocation);
  }else if(inviteType && !talkType && !eventName){
    return 'I was '+invite[inviteType]+' to speak' + location(eventLocation);
  }else if(inviteType && !talkType && eventName){
    return 'I was '+invite[inviteType]+' to speak at ' + eventName + location(eventLocation);
  }else{
    return null;
  }

}

function travelDistance(travelType){
  var type ={
    international:'I made international trip to speak.',
    domestic:'I traveled within my country of residence to speak.',
    local:'I was speaking at a local event.'
  };
  if(travelType){
    return type[travelType];
  }
  return null;
}

function speakerBenefits(ticketType, fee, currency){
  var ticket ={
    free: 'I got free ticket',
    discount:'I got discounted ticket to buy',
    fullprice:'I bought ticket in full price'
  };
  if(ticketType && fee){
    if(fee === '0'){
      return ticket[ticketType] + ', and was not paid to speak.';
    }else{
      return ticket[ticketType] + ', and was paid ' + fee +' '+ currency + ' to speak.';
    }
  }else if(!ticketType && fee){
    if(fee === '0'){
      return 'I was not paid to speak.';
    }else{
      return 'I was paid ' + fee +' '+ currency + ' to speak.';
    }
  }else if(ticketType && !fee){
    return ticket[ticketType] +'.';
  }else{
    return null;
  }
}


function speakerTravel(travelAssistance){
  var assistance ={
    full:'All of my travel and accommodation were covered by the event.',
    partial: 'The event assisted part of my travel and accommodation.',
    none:'The event did not pay for my travel and accommodation.'
  };
  if(travelAssistance){
    return assistance[travelAssistance];
  }
  return null;
}

function employer(travelAssistance, timeOff){
  var assistance ={
    full:'paid all of',
    partial: 'paid some of',
    none:'did not pay'
  };
  var off = {
    working:'It was part of my job to speak.',
    paid_timeoff:'I used my PTO to speak.',
    unpaid_timeoff:'I took unpaid time off to speak.'
  };
  if(travelAssistance && timeOff){
    return 'My employer '+ assistance[travelAssistance] +' my travel expense. '+ off[timeOff];
  }else if(!travelAssistance && timeOff){
    return off[timeOff];
  }else if(travelAssistance && !timeOff){
    return 'My employer '+ assistance[travelAssistance] +' my travel expense.';
  }else{
    return null;
  }
}

function timeCommitment(speakingSlot, speakingSlotUnit, prepTime, prepTimeUnit){
  if(speakingSlot && prepTime){
    return 'My speaking slot was '+speakingSlot+' '+checkSingular(speakingSlot, speakingSlotUnit)+', and it took me ' +prepTime+' '+checkSingular(prepTime, prepTimeUnit) + ' to prepare.';
  }else if(!speakingSlot && prepTime){
    return 'It took me ' +prepTime+' '+checkSingular(prepTime, prepTimeUnit) + ' to prepare.';
  }else if(speakingSlot && !prepTime){
    return 'My speaking slot was '+speakingSlot+' '+checkSingular(speakingSlot, speakingSlotUnit)+'.';
  }else{
    return null;
  }
}

function experience(exp){
  if(exp){
    return 'I had a '+ exp +' experience.';
  }
  return null;
}

function aboutSpeaker(gender, speakingYears, unit){
  if(speakingYears){
    return "I'm a "+gender+' who has speaking for '+ speakingYears + ' ' + checkSingular(speakingYears, unit);
  }
  return null;
}

function also(additionalInfo){
  if(additionalInfo){
    return 'Also, '+ additionalInfo;
  }
  return null;
}

function generate(data){
  return [
    eventDetail(data.invite_type, data.talk_type, data.event_name, data.event_location),
    travelDistance(data.travel_type),
    speakerBenefits(data.ticket_type, data.fee, data.currency),
    speakerTravel(data.travel_assistance),
    employer(data.travel_assistance_by_employer, data.time_off),
    timeCommitment(data.speaking_slot, data.speaking_slot_unit, data.prep_time, data.prep_time_unit),
    experience(data.experience),
    aboutSpeaker(data.gender, data.speaking_years, data.speaking_years_unit),
    also(data.additional_info)
  ].filter(function(n){ return n !== null; });
}

exports.generate = generate;