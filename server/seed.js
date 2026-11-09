// CAPS phase structure. Content is authored once per phase and created for every grade in that phase.
// This is a STARTER curriculum: have a qualified educator review it against CAPS and extend it in Admin > Curriculum.
export const SUBJECTS = [
  ['hl', 'Home Language', 'book', 'Reading, phonics, grammar and writing in your home language.'],
  ['fal', 'First Additional Language', 'chat', 'Everyday conversation, reading and writing in an additional language.'],
  ['maths', 'Mathematics', 'calculator', 'Numbers, patterns, fractions, shapes and real-world problem solving.'],
  ['life', 'Life Skills', 'heart', 'Beginning Knowledge, Creative Arts, Physical Education and Personal and Social Well-being.'],
  ['nst', 'Natural Sciences and Technology', 'flask', 'Living things, matter, energy, structures and our planet.'],
  ['social', 'Social Sciences', 'globe', 'History and Geography: people, places, maps and the past.'],
  ['natsci', 'Natural Sciences', 'flask', 'Cells, body systems, matter and forces.'],
  ['tech', 'Technology', 'cog', 'Structures, mechanisms and the design process.'],
  ['ems', 'Economic and Management Sciences', 'coins', 'Needs and wants, money, budgeting and entrepreneurship.'],
  ['lo', 'Life Orientation', 'compass', 'Relationships, rights, well-being and study skills.'],
  ['arts', 'Creative Arts', 'palette', 'Visual art, music, drama and dance.'],
];
export const CONTENT = `
#hl|1,2,3
@Phonics and Words
Letter sounds|Every letter has a *sound*, like s says sss.;We blend sounds together to make a *word*.;Say a word slowly to hear each *letter*.|Sound it, blend it, say it: S-B-S.|The {group} at the {place} shout out letter sounds. What sound does the word {thing} start with?
Rhyming words|Rhyming words end with the same *sound*, like cat and hat.;A *rhyme* makes songs and poems fun to hear.;Listen to the *ending* to find a rhyme.|Rhymes chime at the end, like a bell at playtime.|Make a rhyme about a {thing}: {thing} sing, {thing} ring!
@Sentences and Stories
Building sentences|A *sentence* starts with a capital letter.;A sentence ends with a *full stop*.;A sentence tells a complete *idea*.|Capital on top, full stop to stop!|Write one sentence about the {hero}: The {hero} loves the {place}.
Parts of a story|Every story has a *beginning*.;Then comes the *middle* where things happen.;The *end* tells how the story finishes.|B-M-E: Begin, Move, End.|Tell a story where a {hero} visits the {place}. What happens first, next and last?
#fal|1,2,3
@Greetings and Words
Greetings|We greet people with *hello* in every language.;In isiZulu we say *Sawubona* and in Setswana we say *Dumela*.;In Afrikaans we say *Goeiedag* and in English we say *Hello*.|Greet with a grin: Hello, Sawubona, Dumela!|Greet the {group} at the {place} with a big Sawubona!
Magic words|We say *please* to ask nicely.;We say *thank you* when someone helps us.;We say *sorry* when we make a mistake.|P-T-S: Please, Thank you, Sorry.|Ask nicely: Please pass the {thing}. Thank you!
@Simple Sentences
I am and I like|We say *I am* to tell who we are.;We say *I like* to share what we enjoy.;We say *I have* to talk about what we own.|Am, Like, Have: three tiny helpers.|I am a {hero}. I like the {place}. I have a {thing}.
Asking questions|A *question* asks for information.;Questions often begin with *what*, *where* or *who*.;A question ends with a *question mark*.|W-W-W: What, Where, Who.|Ask: Where is the {thing}? What does the {hero} do?
#maths|1,2,3
@Numbers and Counting
Counting and patterns|We *count* forward and backward to find how many.;A *pattern* repeats following a rule.;Skip counting in *twos*, fives and tens is faster.|C-P-S: Count, Pattern, Skip.|Count {things} in twos at the {place}. How many are there after five jumps?|pattern
Adding|*Adding* puts groups together.;Count on from the *bigger* number.;The answer to adding is called the *sum*.|Add means all together.|The {group} has some {things} and wins more. Add them to find the sum.|add
@Taking Away and Groups
Subtracting|*Subtracting* means taking away.;Count *back* to find the answer.;The answer to subtracting is the *difference*.|Take away, count back, find the difference.|A {hero} has some {things} and gives some away. How many are left?|sub
Equal groups|*Multiplying* is adding equal groups.;Sharing equally is called *dividing*.;Draw *groups* to see the answer.|Groups to multiply, share to divide.|Put equal {things} into groups at the {place}.|mul
#life|1,2,3
@Beginning Knowledge
Our world|Our *world* has day and night.;There are four *seasons* in a year.;Plants and animals are *living* things.|Sun, Autumn, Winter, Spring: four seasons ring.|Which season would a {hero} choose to visit the {place}?
@Creative Arts
Colours and shapes|The primary *colours* are red, yellow and blue.;Mixing blue and yellow makes *green*.;Circles, squares and triangles are *shapes*.|R-Y-B: the colour crew.|Draw a {thing} using three colours and two shapes.
@Physical Education
Moving safely|A *warm-up* gets our muscles ready.;We *stretch* slowly and never bounce.;We *drink* water after exercise.|W-S-D: Warm up, Stretch, Drink.|Before the {group} plays at the {place}, they warm up first.
@Personal and Social Well-being
Feelings and friends|Feelings like *happy*, sad and angry are normal.;*Kind* words help friends feel safe.;We *share* and take turns.|Kind hearts share: K-H-S.|When the {group} wins, how does a {hero} show kindness?
#hl|4,5,6
@Reading Comprehension
Main idea and details|The *main idea* is what a text is mostly about.;*Details* support the main idea.;Read the title and first sentence to find the *topic*.|Main idea is the umbrella; details are the raindrops.|Read an article about the {place}. What is the main idea?
Making inferences|An *inference* is a clever guess using clues.;Combine what you *read* with what you know.;Always find *evidence* in the text.|Clue plus brain equals inference: C+B=I.|A {hero} is smiling at the {place}. Infer how they feel and find the clue.
@Grammar and Writing
Nouns, verbs and adjectives|A *noun* names a person, place or thing.;A *verb* shows an action.;An *adjective* describes a noun.|Noun is the name, verb is the move, adjective tells more.|The fast {hero} will {action} the {thing}. Spot the noun, verb and adjective.
Writing paragraphs|A *paragraph* is about one idea.;It begins with a *topic* sentence.;*Supporting* sentences add details.|T-S-C: Topic, Support, Conclude.|Write a paragraph about a day at the {place}.
#fal|4,5,6
@Everyday Conversation
Introducing yourself|Say your *name* clearly when you meet someone.;Say where you *live*.;Say what you *enjoy* doing.|N-L-E: Name, Live, Enjoy.|Introduce yourself to the {group}: I enjoy the {place}.
Questions and answers|A *question* needs an answer.;Use *polite* words to reply.;Use full *sentences* when you speak or write.|Q-P-S: Question, Polite, Sentence.|Ask the {hero}: What do you do at the {place}?
@Reading and Writing
Reading short texts|Read the *title* first.;Look for *key* words.;Answer questions with *evidence*.|T-K-E: Title, Key words, Evidence.|Read a short text about a {thing} and find three key words.
Writing a short message|A message has a *greeting*.;It has a *body* with the news.;It ends with a *closing* and your name.|G-B-C: Greeting, Body, Closing.|Write a message inviting a friend to the {place}.
#maths|4,5,6
@Whole Numbers
Multiplication facts|*Multiplication* is repeated addition.;The *product* is the answer.;Use *tables* to learn facts faster.|Times tables are a train: each carriage adds the same.|{things} sit in equal rows at the {place}. How many altogether?|mul
Division facts|*Division* shares into equal groups.;The *quotient* is the answer.;Division is the *opposite* of multiplication.|Divide to share, check with times.|Share {things} equally among the {group}.|div
@Fractions and Shapes
Fractions of numbers|A *fraction* is part of a whole.;The *denominator* shows the equal parts.;The *numerator* shows how many we take.|Down is Denominator; the Number is on top.|The {group} shares {things}. Find a fraction of them.|frac
Perimeter and area|*Perimeter* is the distance around a shape.;*Area* is the space inside.;Area is measured in *square* units.|Perimeter is the path around; area is the ground inside.|The {place} is a rectangle. How far is it all the way round?|geo
@Problem Solving
Adding big numbers|Line up the *place* values.;Add the *ones* first.;*Carry* when you reach ten or more.|O-T-C: Ones, Tens, Carry.|Add the {things} collected by two {group}s.|add
Word problems|*Read* the problem twice.;Choose the *operation*.;*Check* that your answer makes sense.|R-O-C: Read, Operate, Check.|Solve a story about a {hero} at the {place}.|word
#nst|4,5,6
@Living Things
Habitats|A *habitat* is where a living thing lives.;Animals *adapt* to their habitats.;Plants need *sunlight*, water and air.|H-A-S: Home, Adapt, Survive.|Which habitat would a {hero} love to explore?
Life cycles|A *life cycle* shows how a living thing grows.;A butterfly begins as an *egg*.;Then it becomes a *caterpillar* and later a butterfly.|E-C-P-B: Every Caterpillar Pops out a Butterfly.|The {group} draws the life cycle of a butterfly at the {place}.
@Matter and Energy
States of matter|Matter can be a *solid*, liquid or gas.;Heating can *melt* a solid.;Cooling can *freeze* a liquid.|S-L-G: Solid, Liquid, Gas.|Ice at the {place} melts in the sun. Which state changes?
Energy|*Energy* makes things move or change.;The *Sun* gives us light and heat.;Energy can change *form*.|Sun gives Energy, Forms change: S-E-F.|A {hero} uses energy to {action} the {thing}.
@Technology: Structures
Strong structures|A *structure* holds weight.;A *triangle* is a strong shape.;*Materials* must suit the job.|Triangles take the tension.|Design a strong stand for the {thing} at the {place}.
@Planet Earth and Space
Earth and the Sun|Earth *orbits* the Sun.;One orbit takes a *year*.;Earth *spins* to make day and night.|Orbit is a year, spin is a day.|A {hero} looks at Earth from the {place}. How long is one orbit?
#social|4,5,6
@History
Early humans|Early humans were *hunter-gatherers*.;They made *tools* from stone.;Evidence is found in *caves* such as Sterkfontein.|H-G-T: Hunt, Gather, Tools.|A {hero} explores the {place} like a historian.
Mapungubwe kingdom|*Mapungubwe* was an early kingdom in Limpopo.;People traded *gold* and ivory.;We learn about it from *artefacts*.|M-G-A: Mapungubwe, Gold, Artefacts.|Trade {things} like a Mapungubwe trader.
@Geography
Maps and compass|A *compass* shows direction.;The four directions are *north*, south, east and west.;A map *key* explains the symbols.|Never Eat Soggy Waffles: N, E, S, W.|Use a map to find the {place}.
Weather and climate|*Weather* changes daily.;*Climate* is the pattern over many years.;Rain, wind and *temperature* can be measured.|Weather is today; climate is typically.|Is it good weather for the {group} to visit the {place}?
#life|4,5,6
@Creative Arts
Elements of art|Art uses *line*, shape and colour.;A *warm* colour is red, orange or yellow.;A *cool* colour is blue, green or purple.|Warm like fire, cool like the sea.|Create art about a {thing} using warm and cool colours.
@Physical Education
Fitness|*Fitness* keeps our heart strong.;We build *stamina* by moving regularly.;A *warm-up* prevents injury.|F-S-W: Fitness, Stamina, Warm-up.|Plan a training session for the {group} at the {place}.
@Personal and Social Well-being
Healthy choices|A *balanced* plate has many food groups.;*Peer* pressure can be positive or negative.;Say *no* to what feels unsafe.|T-C-A: Think, Choose, Act.|A {hero} chooses a healthy snack before going to the {place}.
#hl|7
@Reading and Language
Figurative language|A *simile* compares using like or as.;A *metaphor* says one thing is another.;*Personification* gives human qualities to objects.|Simile is similar; metaphor is a magic swap.|Describe the {thing} with a simile.
Fact and opinion|A *fact* can be proven.;An *opinion* is a belief.;Words like *best* signal an opinion.|Fact is proof; opinion is personal.|Is "The {hero} is the best" a fact or an opinion?
@Writing
Essay structure|An essay has an *introduction*.;The *body* develops your points.;The *conclusion* sums up.|I-B-C: Introduce, Build, Conclude.|Plan an essay about why the {place} matters.
Tenses|The *past* tense shows what happened.;The *present* tense shows what is happening.;The *future* tense shows what will happen.|P-P-F: Past, Present, Future.|The {group} played, plays and will play at the {place}.
#fal|7
@Speaking and Listening
Formal and informal language|*Formal* language is used with teachers and elders.;*Informal* language is used with friends.;Choose your *tone* to suit the audience.|Formal for the form-room, informal for the field.|How would a {hero} speak to a coach versus a friend?
Skimming and scanning|*Skimming* means reading quickly for the main idea.;*Scanning* means searching for a specific detail.;Headings and *keywords* guide your eyes.|Skim the surface, scan for the gem.|Scan a programme for the {place} opening time.
@Writing
Writing a letter|A letter begins with a *greeting*.;The *body* explains your purpose.;End with a polite *closing*.|G-B-C: Greet, Body, Close.|Write a letter to the {group} about the {place}.
Synonyms and antonyms|A *synonym* has a similar meaning.;An *antonym* has an opposite meaning.;A wider *vocabulary* makes writing richer.|Synonym is same; antonym is opposite.|Find a synonym for fast to describe a {hero}.
#maths|7
@Number Sense
Order of operations|*BODMAS* tells us the order to calculate.;Do *brackets* first.;Then *multiplication* and division before addition and subtraction.|BODMAS: Brackets, Orders, Division, Multiplication, Add, Subtract.|Calculate the {things} scored by the {group} using BODMAS.|word
Multiplying large numbers|Break numbers into *place* values.;Multiply each *part*.;Add the *partial* products.|Break, Multiply, Add.|The {group} has many boxes of {things}. Multiply to find the total.|mul
Dividing large numbers|Use *long* division step by step.;Divide, multiply, *subtract* and bring down.;Check using *multiplication*.|D-M-S-B: Dad Mum Sister Brother.|Share {things} equally among the {group}.|div
@Fractions and Measurement
Common fractions|Find a common *denominator* to add fractions.;*Simplify* by dividing top and bottom by the same number.;Convert between mixed numbers and *improper* fractions.|Same bottom, then add the top.|A {group} shares {things} in fractions.|frac
Perimeter, area and volume|*Perimeter* is the distance around.;*Area* is the space covered.;*Volume* is the space inside a 3D object.|P-A-V: Path, Ground, Volume.|Measure the {place}: its perimeter and area.|geo
Adding large numbers|Line up *place* values.;Add from the *right*.;*Carry* when needed.|Right to left, carry the extra.|Add the {things} won in two matches.|add
#natsci|7
@Life and Living
Cells and microscopes|All living things are made of *cells*.;The *nucleus* controls the cell.;A *microscope* helps us see cells.|Nucleus is the boss, cell is the building block.|A {hero} studies tiny cells from the {place}.
Digestive system|The *mouth* starts digestion.;The *stomach* breaks food down.;The small *intestine* absorbs nutrients.|M-S-I: Mouth, Stomach, Intestine.|Fuel the {group} with a healthy meal before the {place}.
@Matter and Forces
Atoms and elements|An *atom* is the smallest unit of an element.;An *element* has only one type of atom.;A *compound* has different atoms joined.|Atom small, element single, compound joined.|Imagine each {thing} is an atom, then join them to make a compound.
Forces and motion|A *force* is a push or pull.;*Friction* slows things down.;*Gravity* pulls objects towards Earth.|Push, pull, friction, gravity: P-P-F-G.|What forces act when a {hero} uses a {thing} at the {place}?
#social|7
@History
Democracy in South Africa|South Africa became a *democracy* in 1994.;The *Constitution* protects our rights.;Citizens *vote* to choose leaders.|D-C-V: Democracy, Constitution, Vote.|A {hero} votes for the best {place} rules.
Ancient civilisations|Early *civilisations* grew near rivers.;Ancient *Egypt* built pyramids.;People used *writing* to keep records.|River, Egypt, Writing: R-E-W.|Build a pyramid out of {things}.
@Geography
Map skills|*Scale* shows real distance on a map.;A *grid* reference finds a place.;*Contour* lines show height.|S-G-C: Scale, Grid, Contour.|Plot the {place} on a grid map.
Population|*Population* is the number of people in a place.;*Urban* areas are towns and cities.;*Rural* areas are countryside.|Urban is busy; rural is rolling.|Which is better for a {place}: urban or rural?
#tech|7
@Structures
Frame structures|A *frame* structure uses beams and columns.;A *beam* carries load across a gap.;*Braces* stop a frame from collapsing.|Beam bears, brace braces.|Build a frame to hold a {thing}.
@Mechanical Systems
Levers and gears|A *lever* turns around a pivot.;A *gear* changes speed or force.;A *pulley* helps lift loads.|L-G-P: Lever, Gear, Pulley.|Use a lever to lift a {thing} at the {place}.
@Design Process
Investigate, design, make, evaluate|First *investigate* the problem.;Then *design* a solution.;*Make* it, then *evaluate* how well it works.|I-D-M-E: Investigate, Design, Make, Evaluate.|Design a better {thing} for the {group}.
#ems|7
@The Economy
Needs and wants|A *need* is essential for survival.;A *want* is nice to have.;We must make *choices* because resources are limited.|Needs need, wants want.|Is a {thing} a need or a want for a {hero}?
@Money Matters
Budgets and saving|A *budget* plans income and spending.;*Income* is money coming in.;*Savings* are money kept for later.|B-I-S: Budget, Income, Savings.|Budget for a {thing} for the {group}.
@Entrepreneurship
Starting a business|An *entrepreneur* starts a business.;A *product* is something you sell.;*Profit* is income minus costs.|E-P-P: Entrepreneur, Product, Profit.|Sell {things} at the {place}. What is your profit?
#lo|7
@Well-being
Healthy relationships|Healthy relationships are built on *trust*.;*Respect* means valuing others.;*Honesty* builds strong friendships.|T-R-H: Trust, Respect, Honesty.|How does a {hero} show respect to the {group}?
@Citizenship
Rights and responsibilities|The *Constitution* protects our human rights.;Every right has a *responsibility*.;We must *respect* the rights of others.|R-R-R: Rights, Responsibilities, Respect.|The {group} shares the {place} fairly.
@Skills for Success
Study skills|Make a *timetable* for studying.;Study in short *blocks* with breaks.;*Revise* regularly to remember.|T-B-R: Timetable, Blocks, Revise.|Plan study blocks around training at the {place}.
#arts|7
@Visual Art
Elements of design|Design uses *line*, shape and colour.;*Contrast* makes a picture stand out.;*Balance* makes a design feel steady.|L-C-B: Line, Contrast, Balance.|Create a poster of a {thing} using contrast.
@Music
Rhythm and beat|The *beat* is the steady pulse.;*Rhythm* is a pattern of long and short sounds.;*Tempo* is how fast or slow music is.|Beat is the heart, rhythm is the dance.|Clap a rhythm for the {group} at the {place}.
@Drama
Expression and role play|*Voice* and body show feelings.;A *role* is a character you play.;*Improvisation* means acting without a script.|V-R-I: Voice, Role, Improvise.|Act out a day in the life of a {hero}.
`;
