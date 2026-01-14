# Votes API Documentation

This document describes the complete Votes API system used in the MeatEase application. It covers vote data structures, functions, and how vote results are processed and displayed.

---

## Table of Contents

1. [Vote Structures](#vote-structures)
2. [Vote Functions](#vote-functions)
3. [Vote Results and Display](#vote-results-and-display)

---

## Vote Structures

### Vote Descriptor

A **Vote Descriptor** is the core metadata object that defines a vote. It contains all the information about what is being voted on.

**Structure:**
```javascript
{
  id: string,                    // Unique vote identifier (UUID)
  event_id: string,              // ID of the event this vote belongs to
  type: string,                  // Vote type: "time" | "location" | "general"
  question: string,              // The question/prompt for the vote (e.g., "Gdzie idziemy na kolację?")
  deadline: string,              // Deadline date in YYYY-MM-DD format
  deadlineTime: string           // Deadline time in HH:MM format
}
```

**Notes:**
- The `deadline` and `deadlineTime` are stored separately in the frontend but combined into a single ISO timestamp when saved to the database
- The `type` field determines how options are structured:
  - `"time"`: Uses timed options (date + time ranges)
  - `"location"`: Uses text options (location names)
  - `"general"`: Uses text options (any general voting question)

---

### Options

**Options** are the choices available in a vote. The structure depends on the vote type.

#### Text Options (for "general" and "location" votes)

Simple array of strings representing the choices:

```javascript
options: string[]
// Example: ["Restauracja A", "Restauracja B", "Restauracja C"]
```

**Storage:**
- Each option is stored in the `vote_options` table with `option_text` field
- Options are plain text strings

#### Timed Options (for "time" votes)

Array of objects representing date and time ranges:

```javascript
timedOption: Array<{
  date: string,      // Date in YYYY-MM-DD format
  start: string,    // Start time in HH:MM format
  end: string       // End time in HH:MM format
}>
```

**Example:**
```javascript
timedOption: [
  { date: "2025-06-15", start: "18:00", end: "20:00" },
  { date: "2025-06-16", start: "19:00", end: "21:00" }
]
```

**Storage:**
- Timed options are stored as a single string in the format: `"YYYY-MM-DD|HH:MM|HH:MM"`
- Example: `"2025-06-15|18:00|20:00"`
- The pipe character (`|`) is used as a delimiter
- When fetched from the database, they are parsed back into the object format using regex: `/^\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}\|\d{2}:\d{2}$/`

---

### Complete Vote Object Structure

When creating or editing a vote, the complete structure is:

```javascript
{
  voteDescriptor: {
    id: string,
    event_id: string,
    type: "time" | "location" | "general",
    question: string,
    deadline: string,        // YYYY-MM-DD
    deadlineTime: string     // HH:MM
  },
  options: string[],         // For "general" and "location" types
  timedOption: Array<{      // For "time" type
    date: string,
    start: string,
    end: string
  }>
}
```

**Important:**
- For `"time"` votes: Use `timedOption`, `options` should be empty
- For `"location"` and `"general"` votes: Use `options`, `timedOption` should be empty
- At least 2 options/timed options are required for a valid vote

---

## Vote Functions

All vote functions are located in `meetease/src/lib/voteService.js` and are server-side functions (marked with `"use server"`).

### `registerVote(voteData, eventId)`

Registers vote objects during event creation.

**Parameters:**
- `voteData` (Object): Vote data object with structure:
  ```javascript
  {
    time: VoteObject | null,           // Optional time vote
    location: VoteObject | null,        // Optional location vote
    general: VoteObject[] | null        // Optional array of general votes
  }
  ```
- `eventId` (string): The ID of the event to associate votes with

**Returns:**
- `Promise<void>` - Resolves on success, throws error on failure

**Usage:**
```javascript
await registerVote({
  time: {
    voteDescriptor: { /* ... */ },
    timedOption: [ /* ... */ ],
    options: []
  },
  location: {
    voteDescriptor: { /* ... */ },
    options: [ /* ... */ ],
    timedOption: []
  },
  general: [
    {
      voteDescriptor: { /* ... */ },
      options: [ /* ... */ ],
      timedOption: []
    }
  ]
}, eventId)
```

**Internal Process:**
1. Creates vote records in the `votes` table
2. Converts deadline date+time to ISO timestamp using `dayTimeToTimestampTZ()`
3. For timed options: Converts to pipe-delimited string format (`YYYY-MM-DD|HH:MM|HH:MM`)
4. Inserts options into `vote_options` table

---

### `fetchEventVotes(eventId)`

Fetches all votes for a specific event, organized by type.

**Parameters:**
- `eventId` (string): The ID of the event

**Returns:**
- `Promise<Object>` - Object with votes organized by type:
  ```javascript
  {
    time: Array<VoteObject>,      // Array of time votes
    location: Array<VoteObject>,   // Array of location votes
    general: Array<VoteObject>     // Array of general votes
  }
  ```

**VoteObject Structure (returned):**
```javascript
{
  voteDescriptor: {
    id: string,
    event_id: string,
    type: string,
    question: string,
    deadline: string,        // Converted back from timestamp to YYYY-MM-DD
    deadlineTime: string      // Converted back from timestamp to HH:MM
  },
  timedOptions: Array<{      // Parsed from pipe-delimited strings
    date: string,
    start: string,
    end: string
  }>,
  options: string[]          // Plain text options
}
```

**Internal Process:**
1. Fetches all vote descriptors for the event
2. Converts deadline timestamp back to date+time using `timestampTZToDayTime()`
3. Fetches options for each vote
4. For time votes: Parses pipe-delimited strings back to objects
5. Organizes votes by type

---

### `castAVote(voteId, optionId, userId)`

Casts a vote for a specific option.

**Parameters:**
- `voteId` (string): The ID of the vote
- `optionId` (string): The ID of the option being voted for
- `userId` (string): The ID of the user casting the vote

**Returns:**
- `Promise<Object>` - The created user vote record:
  ```javascript
  {
    user_id: string,
    vote_option_id: string,
    // ... other fields
  }
  ```

**Validation:**
- Checks if user can vote (must be event creator or participant)
- Throws error if user cannot vote

**Note:** This function does NOT prevent duplicate votes. The actual vote casting logic in `serverActions.js` (`handleCastGeneralVote`) handles removing previous votes before inserting a new one.

---

### `fetchVoteResultsEventUser(eventId, userId)`

Fetches vote results for an event, including the user's own votes.

**Parameters:**
- `eventId` (string): The ID of the event
- `userId` (string): The ID of the user

**Returns:**
- `Promise<Array>` - Array of vote objects with results:
  ```javascript
  [
    {
      voteDescriptor: {
        id: string,
        event_id: string,
        type: string,
        question: string,
        deadline: string,
        deadlineTime: string
      },
      results: [
        {
          option_id: string,
          option_text: string,
          total_votes: number
        },
        // ... more results
      ],
      userVote: string | null  // ID of the option the user voted for, or null
    },
    // ... more votes
  ]
  ```

**Internal Process:**
1. Fetches all vote descriptors for the event
2. Fetches vote results in bulk (from `vote_results` view/table)
3. For each vote, checks if the user has voted
4. Returns combined structure with results and user's vote

**Usage in Components:**
This is the primary function used by `EventVotings` component to display votes with results.

---

### `getUserVoteByVoteID(userId, voteId)`

Gets the user's vote for a specific vote.

**Parameters:**
- `userId` (string): The ID of the user
- `voteId` (string): The ID of the vote

**Returns:**
- `Promise<Object | null>` - User's vote information:
  ```javascript
  {
    id: string,           // Option ID the user voted for
    voteId: string,       // Vote ID
    user: string          // User ID
  }
  ```
  Or `null` if the user hasn't voted

---

### `fetchVoteVotes(voteId)`

Fetches vote results for a specific vote.

**Parameters:**
- `voteId` (string): The ID of the vote

**Returns:**
- `Promise<Array>` - Array of vote result objects:
  ```javascript
  [
    {
      vote_id: string,
      option_id: string,
      option_text: string,
      total_votes: number,
      question: string,      // From the vote descriptor
      // ... other fields
    },
    // ... more results
  ]
  ```

**Note:** This function queries the `vote_results` table/view which contains aggregated vote counts.

---

### `fetchVotedVotesForEvent(eventId)`

Fetches all votes for an event that have results (i.e., have been voted on).

**Parameters:**
- `eventId` (string): The ID of the event

**Returns:**
- `Promise<Array>` - Array of votes with results:
  ```javascript
  [
    {
      id: string,              // Vote ID
      question: string,         // Vote question
      results: Array<{         // Vote results
        option_id: string,
        option_text: string,
        total_votes: number,
        // ... other fields
      }>
    },
    // ... more votes
  ]
  ```

---

## Vote Results and Display

### Vote Results Structure

Vote results are fetched from the `vote_results` database view/table and have the following structure:

```javascript
{
  option_id: string,        // ID of the vote option
  option_text: string,      // Text of the option (or pipe-delimited string for time votes)
  total_votes: number       // Number of votes cast for this option
}
```

**For Time Votes:**
- `option_text` contains the pipe-delimited format: `"YYYY-MM-DD|HH:MM|HH:MM"`
- Must be parsed for display

---

### EventVotings Component

**Location:** `meetease/src/components/events/event-votings.jsx`

**Props:**
```javascript
{
  user: Object,                    // Current user object
  event: Object,                   // Event object
  fetchEventVotes: Function,       // Function to fetch votes (calls handleFetchVoteResultsEventUser)
  castVote: Function,              // Function to cast a vote
  closeVote: Function,             // Function to close a vote (creator only)
  deleteVote: Function             // Function to delete a vote (creator only)
}
```

**Expected Data Structure:**

The component expects `fetchEventVotes` to return:
```javascript
{
  success: boolean,
  voteResults: [
    {
      voteDescriptor: {
        id: string,
        event_id: string,
        type: "time" | "location" | "general",
        question: string,
        deadline: string,        // YYYY-MM-DD
        deadlineTime: string     // HH:MM
      },
      results: [
        {
          option_id: string,
          option_text: string,
          total_votes: number
        }
      ],
      userVote: string | null    // Option ID the user voted for, or null
    }
  ],
  error: string | null
}
```

**How It Works:**

1. **Loading:** Calls `fetchEventVotes(event.id, user.id)` on mount
2. **Display:** Maps over `voteResults` array and renders `VoteResultBlock` for each vote
3. **Voting:** When user clicks an option, calls `castVote(voteId, optionId, user.id)`
4. **Refresh:** After voting, reloads votes to show updated results

---

### VoteResultBlock Component

**Location:** `meetease/src/components/votes/results/voteResultBlock.jsx`

**Props:**
```javascript
{
  voteDescriptor: {
    id: string,
    type: string,
    question: string,
    deadline: string,
    deadlineTime: string
  },
  results: [
    {
      option_id: string,
      option_text: string,
      total_votes: number
    }
  ],
  userVote: string | null,      // Option ID user voted for
  onCastVote: Function          // Callback: (voteId, optionId) => Promise<void>
}
```

**How It Works:**

1. **Display:** Shows vote question, type description, and deadline
2. **Options:** Maps over `results` array to display each option
3. **Voting:**
   - If `userVote` is `null`: Options are clickable buttons
   - If `userVote` is set: Options are disabled and show percentage bars
4. **Percentage Calculation:**
   ```javascript
   const calculatePercentage = (optionId) => {
     const totalVotes = results.reduce((acc, opt) => acc + opt.total_votes, 0)
     const optionVotes = results.find(opt => opt.option_id === optionId)?.total_votes || 0
     return (optionVotes / totalVotes) * 100
   }
   ```
5. **Visual Feedback:**
   - Before voting: Plain buttons
   - After voting: Buttons show gradient background proportional to vote percentage
   - Percentage displayed as text overlay

**Time Vote Formatting:**

For time votes, the `option_text` is in format `"YYYY-MM-DD|HH:MM|HH:MM"`. The component should format this for display, though the current implementation shows it as-is. A helper function `formatTimeOption` exists in `event-votings.jsx` but is not currently used in `VoteResultBlock`.

**Example Display:**
- Before vote: Clickable button with option text
- After vote: Disabled button with:
  - Gradient background showing percentage (e.g., 60% blue, 40% transparent)
  - Option text
  - Percentage label (e.g., "60%")

---

## Data Flow Example

### Creating a Vote

1. User fills out `GeneralVote` component in event creator
2. Component returns vote object via `returnVoteDescriptor()`:
   ```javascript
   {
     voteDescriptor: { /* ... */ },
     options: ["Option 1", "Option 2"],
     timedOption: []
   }
   ```
3. Event creator collects all votes into `voteObjects`:
   ```javascript
   {
     time: VoteObject | null,
     location: VoteObject | null,
     general: [VoteObject, ...]
   }
   ```
4. `registerVote(voteObjects, eventId)` is called
5. Votes are saved to database

### Displaying Votes

1. `EventVotings` component calls `fetchEventVotes(event.id, user.id)`
2. Server action `handleFetchVoteResultsEventUser` calls `fetchVoteResultsEventUser(eventId, userId)`
3. Function returns array of votes with results and user's votes
4. Component maps over votes and renders `VoteResultBlock` for each
5. Each `VoteResultBlock` displays options and allows voting (if not already voted)

### Casting a Vote

1. User clicks an option in `VoteResultBlock`
2. `onCastVote(voteId, optionId)` is called
3. Server action `handleCastGeneralVote` or `handleCastAVote` is invoked
4. Previous vote by user is deleted (if exists)
5. New vote is inserted
6. Component reloads votes to show updated results

---

## Important Notes

1. **Vote Types:**
   - `"time"`: Uses `timedOption` array, stored as pipe-delimited strings
   - `"location"`: Uses `options` array, plain text
   - `"general"`: Uses `options` array, plain text

2. **Deadline Handling:**
   - Stored as separate date and time in frontend
   - Combined to ISO timestamp in database
   - Converted back to date+time when fetched

3. **Vote Validation:**
   - Users can only vote if they are event creator or participant
   - Votes can be closed by setting deadline to current time
   - Once deadline passes, voting is disabled

4. **Result Aggregation:**
   - Results come from `vote_results` view/table (aggregated)
   - Each result shows `option_id`, `option_text`, and `total_votes`
   - Percentages are calculated client-side

5. **User Vote Tracking:**
   - `userVote` field contains the option ID the user voted for
   - If `null`, user hasn't voted yet
   - Used to disable voting and show results

---

## Database Schema (Reference)

**votes table:**
- `id` (UUID, primary key)
- `event_id` (UUID, foreign key)
- `type` (text: "time" | "location" | "general")
- `question` (text)
- `deadline` (timestamp with timezone)

**vote_options table:**
- `id` (UUID, primary key)
- `vote_id` (UUID, foreign key)
- `option_text` (text)

**user_votes table:**
- `user_id` (UUID, foreign key)
- `vote_option_id` (UUID, foreign key)

**vote_results view/table:**
- Aggregated view showing vote counts per option
- Contains: `vote_id`, `option_id`, `option_text`, `total_votes`, `question`

---

## Summary

The Votes API provides a complete voting system with:
- **Three vote types**: time, location, and general
- **Flexible options**: Text options for general/location, timed options for time votes
- **Result tracking**: Aggregated vote counts with percentage calculations
- **User voting**: Single vote per user per vote (can be changed)
- **Deadline support**: Votes can be closed at a specific date/time
- **Anonymous voting**: Results show percentages, not individual votes

This documentation should provide enough information for any programmer to understand and work with the voting system.
