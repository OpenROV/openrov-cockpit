# Best practices:

* When crafting a message to change the state, use a single message with the state transition ('switch-enable',true/false) as the payload instead of different messages ('switch-enabled/switch-disabled').
This allows subscribing to the "the most" recent version of the message to get the last intended state. 