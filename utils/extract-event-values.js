export const extractEventValues = (events, types) => {
  const typesArray = Array.isArray(types) ? types : [types];

  // Filter the events to include only the specified types
  const filteredEvents = events.filter((event) =>
    typesArray.includes(event.type)
  );

  // Map the filtered events to their values
  return filteredEvents.map((event) => event.value);
};
