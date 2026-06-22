#!/usr/bin/env node
/**
 * generate-new-albums.js
 *
 * Full pipeline for two new NoiraCiel albums:
 *   • "What You're Made Of"      — Hip-Hop Dark / DnB / Soul / Trap · Piano & Violin
 *   • "Bare and Still Breathing" — Unplugged · Guitar & Voice
 *
 * Usage:
 *   node scripts/generate-new-albums.js --submit    # submit all Suno jobs
 *   node scripts/generate-new-albums.js --poll      # poll + download completed tracks
 *   node scripts/generate-new-albums.js --status    # show current state
 *   node scripts/generate-new-albums.js --download  # re-download any completed but missing files
 */

'use strict'

const fs    = require('fs')
const path  = require('path')
const https = require('https')
const http  = require('http')

// ─── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq === -1) continue
    const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

const KIE_BASE   = 'https://api.kie.ai/api/v1'
const ROOT       = path.join(__dirname, '..')
const SLEEP_MS   = 4000
const POLL_MS    = 20_000

const ts    = () => new Date().toISOString().slice(11, 19)
const log   = (m) => console.log(`[${ts()}] ${m}`)
const warn  = (m) => console.warn(`[${ts()}] ⚠  ${m}`)
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function slugify(s) {
  return s.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── Album definitions ────────────────────────────────────────────────────────
const ALBUMS = [
  {
    key:      'wymo',
    title:    "What You're Made Of",
    slug:     'whats-youre-made-of',   // used for site registration
    dirName:  'What_Youre_Made_Of',
    genre:    'Hip-Hop · DnB · Soul · Trap · Piano & Violin',
    siteSlug: 'whats-youre-made-of',
    tracks: [
      {
        num: 1, slug: 'you-were-never-broken', title: 'You Were Never Broken',
        existingTaskId: '1088debb459119e148c157aaf8cacbe1',
        style: 'dark hip-hop trap piano violin soul atmospheric',
        lyrics: `[Verse 1]
You were never broken / just bending under weight
Every crack the light breaks through / every wound a gate
You carried what was never yours / you held what wasn't said
You survived the storm inside / while acting fine instead

[Chorus]
You were never broken / you were learning how to stand
You were never shattered / you were forging who you are
Every fall that pulled you under / was the tide that made you grand
You were never broken / you were always meant to rise

[Verse 2]
The stories that they told you / the lies you learned to keep
The mirror that you hid from / the nights too long to sleep
But here you are still standing / still breathing still alive
Every scar a testament / to everything you've survived

[Chorus]
You were never broken / you were learning how to stand
You were never shattered / you were forging who you are
Every fall that pulled you under / was the tide that made you grand
You were never broken / you were always meant to rise

[Bridge]
Rise slow / rise sure / the ground remembers your name
Rise through / rise true / you are not the same
As the one who fell / as the one who bent
You are everything / that the breaking meant

[Outro]
You were never broken`,
      },
      {
        num: 2, slug: 'the-weight-that-taught-you', title: 'The Weight That Taught You',
        style: 'dark soul DnB piano strings motivational',
        lyrics: `[Verse 1]
There was a season you were carrying / what no one else could see
A mountain made of silence / a river made of need
You didn't ask for any of it / it just appeared one day
But everything that weighted you / was teaching you a way

[Chorus]
The weight that taught you / was the grace you didn't name
The pressure that had broken you / was making you again
You didn't see it as a gift / it came disguised as pain
But the weight that taught you / is the reason that you stand

[Verse 2]
The things that tried to end you / the voices saying quit
The mornings you were drowning / before the day was lit
But something in your marrow / refused to let you go
And the weight kept teaching / what only weight can know

[Chorus]
The weight that taught you / was the grace you didn't name
The pressure that had broken you / was making you again
You didn't see it as a gift / it came disguised as pain
But the weight that taught you / is the reason that you stand

[Bridge]
Not every heavy thing is punishment / some weights are shaping hands
Not every dark is losing light / some darks are making plans
You will look back one morning / and finally understand
The weight that taught you / made you who you are`,
      },
      {
        num: 3, slug: 'start-somewhere', title: 'Start Somewhere',
        style: 'motivational rap trap piano fast dark',
        lyrics: `[Verse 1]
Nobody starts at the finish / nobody wakes up whole
The first step is the hardest / but the first step is the goal
You don't need perfect footing / you don't need the whole plan clear
All you need is just one move / the rest will appear

[Chorus]
Start somewhere / anywhere / just get off the ground
Start somewhere / get in motion / let yourself be found
The version of you who's waiting / is just one step away
Start somewhere / start now / start today

[Verse 2]
You've been waiting for the signal / you've been waiting for the sign
But the door was always open / you just had to cross the line
There is no perfect moment / there is only this right here
The fear will walk beside you / but you move anyway / you move without the clear

[Chorus]
Start somewhere / anywhere / just get off the ground
Start somewhere / get in motion / let yourself be found
The version of you who's waiting / is just one step away
Start somewhere / start now / start today

[Bridge]
Done is better than perfect / going is better than still
The smallest daily action / has more power than sheer will
You don't build a life by thinking / you build it step by step
Start somewhere / keep going / and don't stop yet`,
      },
      {
        num: 4, slug: 'fear-was-never-the-point', title: 'Fear Was Never the Point',
        style: 'dark trap violin piano soul atmospheric',
        lyrics: `[Verse 1]
You let it make the choices / you let it pick the door
You listened to the warnings / of a voice that wanted more
Control over your movements / control over your mind
Fear dressed up as wisdom / telling you to stay behind

[Chorus]
Fear was never the point / it was never meant to win
Fear was just the signal / telling you to begin
The thing on the other side of it / is what you came here for
Fear was never the point / it was just the door

[Verse 2]
Every life that you admire / was built by someone scared
Every dream that somebody reached / was someone who still dared
They felt the same cold shaking / the same uncertain ground
They moved toward what mattered / and eventually they found

[Chorus]
Fear was never the point / it was never meant to win
Fear was just the signal / telling you to begin
The thing on the other side of it / is what you came here for
Fear was never the point / it was just the door

[Bridge]
Walk through it / not around it / that is how the brave are made
Not the ones who feel no fear / but those who move afraid
Every time you chose the harder / every time you pushed the gate
Fear was never the point / courage was always the fate`,
      },
      {
        num: 5, slug: 'the-version-that-survived', title: 'The Version That Survived',
        style: 'hip-hop dark soul DnB piano dramatic',
        lyrics: `[Verse 1]
You have been through versions / of yourself you barely knew
There was the one before the hardest / and the one that made it through
The version that was breaking / while the whole world carried on
The version doing everything / to make it to the dawn

[Chorus]
The version that survived / is the one you are today
The one who didn't give up / when everything said walk away
Every old you led to this you / every wound a stepping stone
The version that survived / is the most powerful you've known

[Verse 2]
You thought those chapters defined you / you thought those scars were signs
That something must be broken / in the architecture of your lines
But look at what you're building / look at how far you've come
The version that survived / is greater than the sum

[Chorus]
The version that survived / is the one you are today
The one who didn't give up / when everything said walk away
Every old you led to this you / every wound a stepping stone
The version that survived / is the most powerful you've known

[Bridge]
Honor all the versions / that are no longer here
The ones who kept it going / through the heaviest of years
They handed you the baton / they didn't let you fall
The version that survived / carries them all`,
      },
      {
        num: 6, slug: 'nothing-needs-fixing-tonight', title: 'Nothing Needs Fixing Tonight',
        style: 'soul piano slow dark trap calming',
        lyrics: `[Verse 1]
You've been working on yourself / since you were old enough to know
That something wasn't right / that you had somewhere else to go
You've been reading and rewriting / and rebuilding every day
But tonight I want to tell you / it's okay to put it away

[Chorus]
Nothing needs fixing tonight / you can breathe
Nothing needs solving / just be
You are allowed to rest / without a reason why
Nothing needs fixing tonight / just let yourself be alive

[Verse 2]
The growth will still be there / when you return tomorrow
You don't have to earn your rest / you don't have to borrow
Permission from the future / to pause here in the now
Nothing needs fixing tonight / let your nervous system bow

[Chorus]
Nothing needs fixing tonight / you can breathe
Nothing needs solving / just be
You are allowed to rest / without a reason why
Nothing needs fixing tonight / just let yourself be alive

[Bridge]
You're enough right now / broken or whole
You're enough right now / tired soul
Rest is not surrender / rest is how you grow
Nothing needs fixing tonight / let go`,
      },
      {
        num: 7, slug: 'the-work-nobody-sees', title: 'The Work Nobody Sees',
        style: 'hip-hop motivational trap piano intense',
        lyrics: `[Verse 1]
You wake before the others / you stay when they have gone
Nobody counts the hours / nobody sees you holding on
The private conversations / you have with who you want to be
The daily small decisions / the invisible machinery

[Chorus]
The work nobody sees / is the work that changes everything
The silent daily grinding / is what success is built from
The sweat behind the curtain / the choosing when it's hard
The work nobody sees / is building who you are

[Verse 2]
They only see the outcome / they only see the shine
They don't know all the mornings / when you couldn't find the line
They didn't see the failures / the pivots and the doubt
But you kept showing up / and you were figuring it out

[Chorus]
The work nobody sees / is the work that changes everything
The silent daily grinding / is what success is built from
The sweat behind the curtain / the choosing when it's hard
The work nobody sees / is building who you are

[Bridge]
One more rep / one more page / one more honest try
One more mile / one more choice / one more asking why
This is where the real work lives / in what nobody knows
The work nobody sees / is where the real you grows`,
      },
      {
        num: 8, slug: 'permission', title: 'Permission',
        style: 'dark soul trap violin piano atmospheric',
        lyrics: `[Verse 1]
You've been waiting for someone / to say you're allowed
To say your dreams are worthy / to say you can be proud
To say the life you're reaching for / is one you get to have
But the only one whose word counts / is the one inside your hands

[Chorus]
Give yourself permission / you don't need their say
Give yourself permission / to build it your way
Nobody's coming / with the blessing you've been waiting for
Give yourself permission / open your own door

[Verse 2]
The gatekeepers are fiction / the chosen ones are lies
Everybody started / with uncertain wondering eyes
They gave themselves the go-ahead / they bet on who they were
And the world kept its opinions / but they moved without the words

[Chorus]
Give yourself permission / you don't need their say
Give yourself permission / to build it your way
Nobody's coming / with the blessing you've been waiting for
Give yourself permission / open your own door

[Bridge]
You are the authority / on what your life should be
You are the signature / at the bottom of the page
Stop requesting what you already have
Give yourself permission / right now / take the stage`,
      },
      {
        num: 9, slug: 'what-you-owe-yourself', title: 'What You Owe Yourself',
        style: 'rap DnB piano motivational dark fast',
        lyrics: `[Verse 1]
You've been paying everybody / every room that called your name
You've been giving them your hours / you've been giving them your flame
But when did you last sit down / and ask what you need
When did you last water / the thing inside that feeds

[Chorus]
You owe yourself the time / you owe yourself the truth
You owe yourself the morning / you owe yourself the proof
That you matter as much / as the people you serve
You owe yourself the life / that you actually deserve

[Verse 2]
This isn't about selfishness / this isn't taking more
This is about the oxygen / before you can restore
The others in the cabin / the ones who need your strength
You have to fill yourself / before you go the length

[Chorus]
You owe yourself the time / you owe yourself the truth
You owe yourself the morning / you owe yourself the proof
That you matter as much / as the people you serve
You owe yourself the life / that you actually deserve

[Bridge]
Rest / heal / dream / grow
Ask for what you need / let yourself know
That the debt you owe yourself / is long past due
What you owe yourself / is actually you`,
      },
      {
        num: 10, slug: 'slow-becoming', title: 'Slow Becoming',
        style: 'soul dark atmospheric piano violin slow trap',
        lyrics: `[Verse 1]
You won't see it happening / it moves like glaciers do
The millimeter daily / is how you're becoming you
The incremental shifting / the grain upon the grain
Is building something solid / in the ordinary days

[Chorus]
Slow becoming / is still becoming
Slow is not the failure / slow is how the deep grows
Slow becoming / is still becoming
The river doesn't rush / but it always knows

[Verse 2]
The world is selling overnight / the world is selling fast
But nothing built in shortcut / is the kind of thing that lasts
The person you're becoming / is assembled every day
In the patient repetition / in the choosing of the way

[Chorus]
Slow becoming / is still becoming
Slow is not the failure / slow is how the deep grows
Slow becoming / is still becoming
The river doesn't rush / but it always knows

[Bridge]
Trust the slow / trust the quiet
Trust the work / you can't yet see
Trust the slow / trust the patient
Trust who you are / becoming to be`,
      },
      {
        num: 11, slug: 'forgive-the-one-who-didnt-know', title: "Forgive the One Who Didn't Know",
        style: 'dark soul piano trap emotional',
        lyrics: `[Verse 1]
There's a version of you in the past / who made the choices that they made
With the tools and information / and the fear that wouldn't fade
They weren't wrong because they chose it / they were doing what they knew
Don't hold that old self hostage / they were just an earlier you

[Chorus]
Forgive the one who didn't know / they were only doing their best
Forgive the one who dropped the ball / they were carrying too much chest
Let them go with love / let the guilt unwind
Forgive the one who didn't know / so you can free your mind

[Verse 2]
The decisions that still haunt you / in the 3am replays
Were made by someone younger / navigating darker days
You have more now / you have learned now / you can choose now differently
But punishing the past self / keeps you from being free

[Chorus]
Forgive the one who didn't know / they were only doing their best
Forgive the one who dropped the ball / they were carrying too much chest
Let them go with love / let the guilt unwind
Forgive the one who didn't know / so you can free your mind

[Bridge]
Compassion for yourself / is not excusing / it's understanding
Compassion for the one you were / is where the healing's landing
You forgive others / now turn it inward / see the younger face
Forgive the one who didn't know / and let yourself have grace`,
      },
      {
        num: 12, slug: 'built-in-the-dark', title: 'Built in the Dark',
        style: 'hip-hop dark DnB piano violin intense atmospheric',
        lyrics: `[Verse 1]
They didn't see you building / when the lights went out
They didn't see the late nights / when you wrestled with the doubt
Nobody was watching / when you chose to keep the faith
Nobody witnessed / every single thing you faced

[Chorus]
You built it in the dark / when nobody could see
You built it out of nothing / out of what you chose to be
The hardest work was hidden / the most real was underground
You built it in the dark / and now it's finally found

[Verse 2]
The diamond doesn't form / in the comfortable light
The toughest transformations / happen in the private night
The world sees the after / but you lived the before
The building in the dark / is what the after is for

[Chorus]
You built it in the dark / when nobody could see
You built it out of nothing / out of what you chose to be
The hardest work was hidden / the most real was underground
You built it in the dark / and now it's finally found

[Bridge]
In the dark / you learned your limits
In the dark / you found your fire
In the dark / you discovered / what it means to go higher
Everything you stand on / was assembled in that space
Built in the dark / now standing in the grace`,
      },
      {
        num: 13, slug: 'the-quiet-revolution', title: 'The Quiet Revolution',
        style: 'trap DnB piano violin motivational dark',
        lyrics: `[Verse 1]
It doesn't always come with noise / it doesn't always shout
Sometimes the revolution / is a quiet turning out
Of the habits that were hurting / of the stories you'd believed
The quiet revolution / is the deepest to achieve

[Chorus]
The quiet revolution / is the hardest kind to make
It's the inner life rewriting / it's the daily choice awake
It's the no you say to patterns / and the yes to what is true
The quiet revolution / is what's happening in you

[Verse 2]
Nobody puts this on a stage / nobody posts this online
The quiet revolution / moves beneath the social shrine
It's the therapy appointment / the journal at midnight
The boundary that cost something / the choice to live in light

[Chorus]
The quiet revolution / is the hardest kind to make
It's the inner life rewriting / it's the daily choice awake
It's the no you say to patterns / and the yes to what is true
The quiet revolution / is what's happening in you

[Bridge]
The world doesn't always notice / but the world is changed by this
Every inner revolution / is a global genesis
The quietest uprising / is the one that rearranges everything
The quiet revolution / is already happening`,
      },
      {
        num: 14, slug: 'not-your-worst-day', title: 'Not Your Worst Day',
        style: 'soul rap piano dark emotional motivational',
        lyrics: `[Verse 1]
You remember it completely / you remember every piece
The day that felt like ending / the day that wouldn't cease
But you have forgotten something / in the way you tell the tale
That day was not the verdict / that day was not the scale

[Chorus]
You are not your worst day / you are not the fall
You are not the crisis / you are not the call
That you made when you were breaking / that you can't take back
You are not your worst day / and that day is not your track

[Verse 2]
The shame has made it larger / the shame has made it you
But the worst day of a person / is the least of all they do
You have had a thousand mornings / since that day came and went
You have had a thousand choices / and a thousand times you went

[Chorus]
You are not your worst day / you are not the fall
You are not the crisis / you are not the call
That you made when you were breaking / that you can't take back
You are not your worst day / and that day is not your track

[Bridge]
Let it be one chapter / not the author not the spine
Let it be one sentence / in a long and living line
The story is still going / and the worst is not the last
You are not your worst day / you are more than your past`,
      },
      {
        num: 15, slug: 'whats-youre-made-of', title: "What You're Made Of",
        style: 'dark hip-hop DnB piano violin epic closing',
        lyrics: `[Verse 1]
When everything aligned against you / when the ground was not the ground
When the people that you counted on / were nowhere to be found
When you had to be the lifeline / when you had to hold the rope
That's when you discovered / what it is that you are made of and of hope

[Chorus]
You are made of all the mornings / you got up and tried again
You are made of all the places / where you learned to hold the pain
You are made of every rising / you are made of every storm
You are made of something harder / and more beautiful and warm

[Verse 2]
Nobody gave you what you have / you built it day by day
You stitched together dignity / when it tried to fray away
There were rooms that tried to hollow you / there were years that tried to win
But there was always something in you / that refused to give in

[Chorus]
You are made of all the mornings / you got up and tried again
You are made of all the places / where you learned to hold the pain
You are made of every rising / you are made of every storm
You are made of something harder / and more beautiful and warm

[Bridge]
This is not the end / this is not the ceiling
This is just the proof / of everything you're feeling
You survive and then you build / you build and then you soar
What you're made of / is what you were always fighting for

[Outro]
This is what you're made of
This is who you are`,
      },
    ],
  },
  {
    key:      'basb',
    title:    'Bare and Still Breathing',
    slug:     'bare-and-still-breathing',
    dirName:  'Bare_And_Still_Breathing',
    genre:    'Unplugged · Acoustic · Guitar & Voice',
    siteSlug: 'bare-and-still-breathing',
    tracks: [
      {
        num: 1, slug: 'still-here', title: 'Still Here',
        style: 'acoustic guitar folk soft voice gentle unplugged',
        lyrics: `[Verse 1]
I didn't know if I would make it / through that particular night
But something kept me breathing / kept me reaching for the light
It wasn't grand or glorious / no one saw the battle won
But I opened up the curtains / and I let in the morning sun

[Chorus]
I'm still here / still here / still breathing through the doubt
I'm still here / still here / after everything that tried to take me out
Some days that's all there is / some days that's enough
I'm still here / and still here is not nothing / still here is love

[Verse 2]
The small things kept me going / the coffee and the rain
The dog that needed walking / the ordinary sane
The list of things worth staying for / was longer than I thought
I'm still here to count them / every quiet gift I've got

[Chorus]
I'm still here / still here / still breathing through the doubt
I'm still here / still here / after everything that tried to take me out
Some days that's all there is / some days that's enough
I'm still here / and still here is not nothing / still here is love

[Outro]
Still here / still here / still here`,
      },
      {
        num: 2, slug: 'one-more-morning', title: 'One More Morning',
        style: 'acoustic guitar voice intimate soft motivational',
        lyrics: `[Verse 1]
I'll give myself one more morning / before I decide
One more cup of something warm / before the world gets wide
The problems will be waiting / they will not run away
But one more morning first / before I face the day

[Chorus]
One more morning / soft and quiet
One more chance / before the riot
One more breath / before the weight
One more morning / and I'll be great

[Verse 2]
I've learned the value of the morning / before the phone gets in
Before the world starts wanting things / before the noise begins
This is mine / this quiet moment / this is where I fill
One more morning / simple / still

[Chorus]
One more morning / soft and quiet
One more chance / before the riot
One more breath / before the weight
One more morning / and I'll be great

[Bridge]
Not tomorrow / not last night / just this morning right here
Not the failure / not the future / just this light and this air
One more morning / is enough / it is enough to begin
One more morning / let me in`,
      },
      {
        num: 3, slug: 'show-up', title: 'Show Up',
        style: 'acoustic guitar soul voice soft folk',
        lyrics: `[Verse 1]
You don't have to have it figured / you don't need the whole plan clear
You just need to show up / and let your showing up appear
Half the battle is the being there / is not running out the door
Show up small / show up shaking / and then show up some more

[Chorus]
Show up / just show up / that's the whole of it
Show up / even broken / even not sure you can sit
With the discomfort and the fear / and the question of it all
Show up / keep showing up / and catch yourself before you fall

[Verse 2]
I've seen the ones who made it / they were not the most prepared
They were not the most talented / but they were the ones who dared
To keep appearing / to keep coming back around
Every time they wanted to vanish / they came back / they stayed / they found

[Chorus]
Show up / just show up / that's the whole of it
Show up / even broken / even not sure you can sit
With the discomfort and the fear / and the question of it all
Show up / keep showing up / and catch yourself before you fall

[Bridge]
Show up for yourself / the way you'd show for someone who needs you
Show up with that same grace / that same gentle / that same allow
Show up / is the whole instruction / show up / is the whole vow`,
      },
      {
        num: 4, slug: 'i-see-you-trying', title: 'I See You Trying',
        style: 'acoustic guitar voice tender emotional soft',
        lyrics: `[Verse 1]
I know you think nobody's noticing / the effort that it takes
To hold yourself together / while the whole interior shakes
To smile at the table / to show up and be present
While carrying the quiet weight / of all that's so incessant

[Chorus]
I see you trying / even when it doesn't show
I see you reaching / even when it's slow
I see the daily courage / in the ordinary brave
I see you trying / and that is not nothing / that means everything today

[Verse 2]
The therapy appointment / the boundary that you kept
The night you chose to stay / the morning that you wept
And still came to the table / still brought what you had
I see you trying / even on the bad

[Chorus]
I see you trying / even when it doesn't show
I see you reaching / even when it's slow
I see the daily courage / in the ordinary brave
I see you trying / and that is not nothing / that means everything today

[Bridge]
You don't have to be succeeding / to be worth my witness
You don't have to have arrived / to be worth my listening
I see you trying / and I want you to know / that's enough
I see you trying / and trying is enough`,
      },
      {
        num: 5, slug: 'enough-already', title: 'Enough Already',
        style: 'acoustic guitar voice soft folk affirming',
        lyrics: `[Verse 1]
You've been measuring yourself / against an impossible line
You've been counting every failing / from the beginning of time
But let me ask you something honest / when you look at someone you love
Do you count their every shortfall / do you tell them they're not enough

[Chorus]
Enough already / you are enough / just as you are
Enough already / right now / as you stand
You don't need to be more / you don't need to be other
Enough already / take your own hand

[Verse 2]
The striving has its place / and growth is good and right
But there is also being / there is also just tonight
You are allowed to be unfinished / you are allowed to be in process
Enough already / with the self-assessment / just be

[Chorus]
Enough already / you are enough / just as you are
Enough already / right now / as you stand
You don't need to be more / you don't need to be other
Enough already / take your own hand

[Bridge]
Enough / is not giving up / enough is rest
Enough / is not settling / enough is yes
To the person you are / in this season / in this skin
Enough already / let yourself in`,
      },
      {
        num: 6, slug: 'when-it-gets-quiet', title: 'When It Gets Quiet',
        style: 'acoustic guitar voice slow meditative soft',
        lyrics: `[Verse 1]
When it gets quiet / that is when the voice comes in
The one you've been avoiding / the one beneath the din
It's not always comfortable / what the quiet brings to light
But what the quiet shows you / is the thing you need tonight

[Chorus]
When it gets quiet / listen
When it gets quiet / that's when you find yourself
When it gets quiet / something opens
When it gets quiet / that's where the truth is held

[Verse 2]
We fill the spaces quickly / we keep the volume high
We scroll until the morning / we let the hours fly
Because the quiet asks us / to be honest and alone
With the life we are creating / and the seeds that we have sown

[Chorus]
When it gets quiet / listen
When it gets quiet / that's when you find yourself
When it gets quiet / something opens
When it gets quiet / that's where the truth is held

[Bridge]
Sit with it / don't run / let the quiet do its work
Let the silence hold you / let the stillness be the search
You will not fall apart / in the quiet you will find
The clearest truest version / of the content of your mind`,
      },
      {
        num: 7, slug: 'just-a-little-longer', title: 'Just a Little Longer',
        style: 'acoustic guitar voice tender hope soft folk',
        lyrics: `[Verse 1]
If you're thinking about stopping / if you're standing at the edge
If the weight has got too heavy / and you're barely on the ledge
I'm not here to tell you easy / I know easy isn't true
But I am here to ask you / just a little longer / please push through

[Chorus]
Just a little longer / just one more day
Just a little longer / just don't walk away
The thing you can't imagine / the turn you cannot see
Is just a little longer / from where you are right now / believe

[Verse 2]
I know the road is weary / I know the night is long
I know the reasons stacking / feel louder than this song
But somewhere in your story / there are pages still to write
Just a little longer / one more try / one more night

[Chorus]
Just a little longer / just one more day
Just a little longer / just don't walk away
The thing you can't imagine / the turn you cannot see
Is just a little longer / from where you are right now / believe

[Bridge]
If you need to reach out / please reach out / you matter here
If you need to talk to someone / please / there are people near
Just a little longer / this too will change / this too will shift
Just a little longer / the fog will lift`,
      },
      {
        num: 8, slug: 'you-already-know', title: 'You Already Know',
        style: 'acoustic guitar voice wise intimate soft folk',
        lyrics: `[Verse 1]
You've been asking everyone around you / what the answer is
But somewhere underneath the question / you already know what this
feeling in your body means / you already know the truth
You've just been hoping someone else would / give permission to you

[Chorus]
You already know / you already feel it
You already have the answer / you just need to hear it
From your own voice / from your own heart
You already know / now trust your part

[Verse 2]
The mentor and the book and the therapy are good
And listening to others helps / I've always understood
But there's a knowing in your own bones / there's a compass in your gut
That keeps pointing to the same thing / that keeps coming back to what

[Chorus]
You already know / you already feel it
You already have the answer / you just need to hear it
From your own voice / from your own heart
You already know / now trust your part

[Bridge]
Trust yourself / the way you trust / the ones you love the most
Trust the voice that shows up quiet / when you need it most
You've built a body of knowledge / from living through your years
You already know / you've always known / just listen through the fear`,
      },
      {
        num: 9, slug: 'slow-down', title: 'Slow Down',
        style: 'acoustic guitar voice gentle peaceful folk',
        lyrics: `[Verse 1]
You don't have to be in motion / every hour of the day
The world will still be turning / if you stop and sit a while and stay
The urgent list is endless / there will always be more to do
But you are worth more than your output / slow down / this is for you

[Chorus]
Slow down / breathe / the world can wait
Slow down / let the moment find you / before it's too late
Slow down / because speed / is not the same as living
Slow down / and see what life / has been trying to be giving

[Verse 2]
I've seen the cost of rushing / I've seen what speed can cost
The relationships abandoned / the moments that were lost
The body keeping score / of everything you've overrun
Slow down before it asks you / before your body stops the run

[Chorus]
Slow down / breathe / the world can wait
Slow down / let the moment find you / before it's too late
Slow down / because speed / is not the same as living
Slow down / and see what life / has been trying to be giving

[Bridge]
Speed is easy / presence takes a practice
Fast is default / slow is where the magic is
Slow down / and live in the specific / live in the detail / live in the now
Slow down / let me show you how`,
      },
      {
        num: 10, slug: 'the-good-youve-done', title: "The Good You've Done",
        style: 'acoustic guitar voice tender affirming soft',
        lyrics: `[Verse 1]
You catalogue the failures / with such a careful hand
You remember every falling short / each thing that didn't land
But when did you last count / the ordinary good you've done
The call that gave somebody light / the door that you held open

[Chorus]
The good you've done / is real / it counts / it matters still
The kindness in the corner / is the antidote to ill
The good you've done / is in the world / it doesn't disappear
The good you've done / add it to the ledger / you are more than the fear

[Verse 2]
The child that you protected / the friend that you heard out
The time you showed up honest / when someone needed without doubt
The version of your voice / that got someone through a night
The good you've done / is woven / into so much living light

[Chorus]
The good you've done / is real / it counts / it matters still
The kindness in the corner / is the antidote to ill
The good you've done / is in the world / it doesn't disappear
The good you've done / add it to the ledger / you are more than the fear

[Bridge]
Count it / like you count / the things you got wrong
Count the good / with the same attention / hold it just as long
You are not only your failings / you are also all of this
The good you've done / and that is not small / that is everything`,
      },
      {
        num: 11, slug: 'after-the-storm', title: 'After the Storm',
        style: 'acoustic guitar voice hopeful gentle folk',
        lyrics: `[Verse 1]
There will be an after / I promise you there will
There will be a morning / when the air is still again
The storm is not forever / even though it feels that way
There will be an after / and you're going to be okay

[Chorus]
After the storm / the ground is new
After the storm / you'll see the blue
After the storm / comes the rebuild / comes the learn
After the storm / you'll know more than before the storm / at every turn

[Verse 2]
I have been in the middle / where the middle has no end
I have been the person / wondering if they'd mend
And every single time / when I couldn't see the shore
The after came eventually / as it always had before

[Chorus]
After the storm / the ground is new
After the storm / you'll see the blue
After the storm / comes the rebuild / comes the learn
After the storm / you'll know more than before the storm / at every turn

[Bridge]
You are in the storm right now / not after / I know
But after is already forming / you just can't see it yet / it's slow
Hold on through the weather / the after will arrive
After the storm / you will be more alive`,
      },
      {
        num: 12, slug: 'keep-going-love', title: 'Keep Going, Love',
        style: 'acoustic guitar voice warm tender folk intimate',
        lyrics: `[Verse 1]
I know you're almost empty / I know the tank is low
I know you've been on running / on a fume and a prayer and a hope
But you have done this before / you have made it through the dry
And something in you kept the faith / and I'm asking you one more time to try

[Chorus]
Keep going love / keep going
I know the path is hard to see
Keep going love / keep going
The version of you who made it / is asking from the other side of free
Keep going love

[Verse 2]
Not because it's always beautiful / not because it doesn't hurt
Not because the struggle / isn't sometimes in the dirt
But because the life you're building / has a shape you haven't seen
Keep going love / it's worth it / I believe

[Chorus]
Keep going love / keep going
I know the path is hard to see
Keep going love / keep going
The version of you who made it / is asking from the other side of free
Keep going love

[Bridge]
One foot / then the other / is the whole of how it's done
One foot / then the other / is how every race is run
There is no secret / there is only this / the keep
Keep going love / keep going / the harvest follows the steep`,
      },
      {
        num: 13, slug: 'roots', title: 'Roots',
        style: 'acoustic guitar voice folk grounded warm',
        lyrics: `[Verse 1]
You forget that you have roots / when the wind is blowing strong
You forget how deep your anchors go / when the storm has been too long
But the roots are still beneath you / even when the branches bend
Your roots remember who you are / and hold you through the end

[Chorus]
Roots / you have roots / that go deeper than the storm
Roots / you have roots / in the love you've known before
Roots / in the people / in the choices / in the ground
Roots / you have roots / and they are always to be found

[Verse 2]
Your roots are in the kindness / of the people who stayed up
Who held you through the worst of it / who kept refilling your cup
Your roots are in the values / that you carry in your chest
Your roots are in the person / that you're working to express

[Chorus]
Roots / you have roots / that go deeper than the storm
Roots / you have roots / in the love you've known before
Roots / in the people / in the choices / in the ground
Roots / you have roots / and they are always to be found

[Bridge]
When you feel like floating / when you feel unmoored
When the ground has disappeared / beneath the overload
Remember where you came from / remember what you've built
Remember you have roots / and roots are never spilt`,
      },
      {
        num: 14, slug: 'the-simplest-things', title: 'The Simplest Things',
        style: 'acoustic guitar voice gentle folk grateful',
        lyrics: `[Verse 1]
I used to chase the monument / the landmark and the sign
I used to think the meaning / was in the grand design
But something in the living / has been slowly shifting me
The simplest things are where the most / important living be

[Chorus]
The simplest things / the coffee and the friend
The window in the morning / the song that doesn't end
The simplest things / the hand that finds your hand
The simplest things / are more than I had planned

[Verse 2]
The conversation that ran late / because nobody wanted to leave
The meal that had no recipes / that someone made for me
The text that simply said I thought of you today
The simplest things / are what the meaning is / I'd say

[Chorus]
The simplest things / the coffee and the friend
The window in the morning / the song that doesn't end
The simplest things / the hand that finds your hand
The simplest things / are more than I had planned

[Bridge]
I'm not chasing monuments anymore / I'm building ordinary days
Stacking simple beauties / in their hundred gentle ways
The simplest things / are what I'll remember when I go
The simplest things / are what I've come to know`,
      },
      {
        num: 15, slug: 'bare-and-still-breathing', title: 'Bare and Still Breathing',
        style: 'acoustic guitar voice intimate emotional closing folk',
        lyrics: `[Verse 1]
I have stripped away the armor / I have put it all down now
I am bare and still breathing / and I'm learning how
To be without the covering / to stand in the exposed
To let the real be visible / to let the guarded close

[Chorus]
Bare and still breathing / that's where I am
Bare and still breathing / no longer pretending
Bare and still breathing / is the bravest I have been
Bare and still breathing / and finally free to be seen

[Verse 2]
The masks were getting heavy / the performance was a cost
I was building walls for safety / but I was getting lost
Inside the architecture / of the self I showed the world
Bare and still breathing / the real can be unfurled

[Chorus]
Bare and still breathing / that's where I am
Bare and still breathing / no longer pretending
Bare and still breathing / is the bravest I have been
Bare and still breathing / and finally free to be seen

[Bridge]
This is not the end / this is the opening
This is not defeat / this is the reckoning
The stripping down to essence / is the start of the rebuild
Bare and still breathing / alive / returned / revealed

[Outro]
Bare and still breathing
Still here
Still mine`,
      },
    ],
  },
]

// ─── State file ───────────────────────────────────────────────────────────────
const STATE_FILE = path.join(ROOT, '.score-work', 'new-albums-state.json')

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch {}
  }
  return {}
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

// ─── KIE.AI HTTP ──────────────────────────────────────────────────────────────
const API_KEY = process.env.KIE_API_KEY
if (!API_KEY) { console.error('[!] KIE_API_KEY not set'); process.exit(1) }

function kieGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${KIE_BASE}${endpoint}`)
    const opts = {
      hostname: url.hostname, port: 443, path: url.pathname + url.search, method: 'GET',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error(data)) } })
    })
    req.on('error', reject)
    req.end()
  })
}

function kiePost(endpoint, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const opts = {
      hostname: 'api.kie.ai', port: 443, path: `/api/v1${endpoint}`, method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error(data)) } })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    const file = fs.createWriteStream(destPath)
    const proto = url.startsWith('https') ? https : http
    proto.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        return resolve(downloadFile(res.headers.location, destPath))
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', e => { fs.unlink(destPath, () => {}); reject(e) })
  })
}

// ─── Submit all tracks ────────────────────────────────────────────────────────
async function cmdSubmit() {
  const state = loadState()
  let submitted = 0

  for (const album of ALBUMS) {
    for (const track of album.tracks) {
      const key = `${album.key}:${track.slug}`

      if (state[key]?.taskId) {
        log(`⏭  ${track.title} — already submitted (${state[key].taskId})`)
        continue
      }

      // Pre-existing test job
      if (track.existingTaskId) {
        state[key] = { taskId: track.existingTaskId, status: 'PENDING', albumKey: album.key, albumDir: album.dirName, num: track.num, slug: track.slug, title: track.title }
        log(`✓  ${track.title} — using existing taskId ${track.existingTaskId}`)
        saveState(state)
        continue
      }

      try {
        const res = await kiePost('/generate', {
          model:       'V4',
          customMode:  true,
          prompt:      track.lyrics,
          style:       track.style,
          title:       track.title,
          instrumental: false,
          callBackUrl: 'https://noiraciel.com/api/noop',
        })
        if (res.code !== 200) throw new Error(res.msg)
        state[key] = { taskId: res.data.taskId, status: 'PENDING', albumKey: album.key, albumDir: album.dirName, num: track.num, slug: track.slug, title: track.title }
        log(`✓  Submitted: ${track.title} → ${res.data.taskId}`)
        submitted++
        saveState(state)
        await sleep(SLEEP_MS)
      } catch (e) {
        log(`✗  Failed to submit ${track.title}: ${e.message}`)
      }
    }
  }
  log(`\nDone. ${submitted} new jobs submitted.`)
}

// ─── Poll + download ──────────────────────────────────────────────────────────
async function cmdPoll() {
  const state = loadState()
  let pending = 0, done = 0, failed = 0

  for (const [key, info] of Object.entries(state)) {
    if (info.status === 'DOWNLOADED') { done++; continue }

    const res = await kieGet(`/generate/record-info?taskId=${info.taskId}`)
    const data = res.data ?? {}
    const status = data.status ?? 'PENDING'

    if (status === 'SUCCESS' || (data.response?.sunoData?.length > 0)) {
      const sunoData = data.response?.sunoData ?? []
      if (sunoData.length > 0) {
        const first = sunoData[0]
        const audioUrl  = first.audioUrl ?? first.audio_url
        const lyricsText = first.lyrics ?? ''

        const albumDir = path.join(ROOT, 'Music', info.albumDir)
        const audioDir  = path.join(albumDir, 'audio')
        const lyricsDir = path.join(albumDir, 'lyrics')
        fs.mkdirSync(audioDir,  { recursive: true })
        fs.mkdirSync(lyricsDir, { recursive: true })

        const numStr  = String(info.num).padStart(2, '0')
        const mp3Dest = path.join(audioDir,  `${numStr}_${info.slug}_v1.mp3`)
        const mdDest  = path.join(lyricsDir, `${numStr}_${info.slug}_v1.md`)

        if (audioUrl) {
          log(`↓  Downloading ${info.title}…`)
          await downloadFile(audioUrl, mp3Dest)
          log(`   ✓  ${path.relative(ROOT, mp3Dest)}`)
        }

        if (lyricsText) {
          fs.writeFileSync(mdDest, `---\ntitle: ${info.title}\n---\n\n${lyricsText}\n`)
          log(`   ✓  Lyrics saved`)
        }

        state[key].status = 'DOWNLOADED'
        state[key].audioUrl = audioUrl
        state[key].mp3Path  = mp3Dest
        saveState(state)
        done++
      } else {
        log(`⏳ ${info.title} — SUCCESS but no sunoData yet`)
        pending++
      }
    } else if (status === 'FAILED' || status === 'ERROR') {
      log(`✗  ${info.title} — FAILED`)
      state[key].status = 'FAILED'
      saveState(state)
      failed++
    } else {
      log(`⏳ ${info.title} — ${status}`)
      pending++
    }
    await sleep(500)
  }

  log(`\nStatus: ${done} downloaded · ${pending} pending · ${failed} failed`)
  if (pending > 0) log(`Run --poll again in ~2 min to check remaining tracks`)
}

// ─── Status overview ──────────────────────────────────────────────────────────
function cmdStatus() {
  const state = loadState()
  const totals = { PENDING: 0, SUCCESS: 0, DOWNLOADED: 0, FAILED: 0 }
  for (const [key, info] of Object.entries(state)) {
    const s = info.status ?? 'PENDING'
    totals[s] = (totals[s] ?? 0) + 1
    const icon = s === 'DOWNLOADED' ? '✓' : s === 'FAILED' ? '✗' : '⏳'
    console.log(`${icon}  [${info.albumKey}] ${info.title} — ${s}`)
  }
  console.log(`\nTotal: ${Object.values(totals).reduce((a,b)=>a+b,0)} tracks — ${totals.DOWNLOADED} downloaded, ${totals.PENDING} pending, ${totals.FAILED} failed`)
}

// ─── Write lyrics from ALBUMS definition (before Suno downloads) ──────────────
async function cmdWriteLyrics() {
  for (const album of ALBUMS) {
    const lyricsDir = path.join(ROOT, 'Music', album.dirName, 'lyrics')
    fs.mkdirSync(lyricsDir, { recursive: true })
    for (const track of album.tracks) {
      const numStr  = String(track.num).padStart(2, '0')
      const dest    = path.join(lyricsDir, `${numStr}_${track.slug}_v1.md`)
      if (!fs.existsSync(dest)) {
        fs.writeFileSync(dest, `---\ntitle: ${track.title}\n---\n\n${track.lyrics.trim()}\n`)
        log(`✓  ${dest.replace(ROOT + '/', '')}`)
      }
    }
  }
  log('Lyrics written.')
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
;(async () => {
  if (args.includes('--submit')) {
    await cmdSubmit()
  } else if (args.includes('--poll')) {
    await cmdPoll()
  } else if (args.includes('--status')) {
    cmdStatus()
  } else if (args.includes('--write-lyrics')) {
    await cmdWriteLyrics()
  } else {
    console.log(`Usage:
  node scripts/generate-new-albums.js --submit        submit all 30 Suno jobs
  node scripts/generate-new-albums.js --poll          poll + download completed tracks
  node scripts/generate-new-albums.js --status        show state
  node scripts/generate-new-albums.js --write-lyrics  write lyrics from definition (no API)`)
  }
})()
