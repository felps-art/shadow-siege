/// @desc Layer utilities and constants
#macro LAYER_INSTANCES "Instances"

/// @function layer_get_or_create_instances()
/// @desc Returns the name of the main instances layer, creating it if missing.
function layer_get_or_create_instances() {
    var lname = LAYER_INSTANCES;
    if (!layer_exists(lname)) {
        // Try to create in current room. In GameMaker, layer_create returns id; we keep name for creation calls.
        layer_create(-1, lname);
    }
    return lname;
}
