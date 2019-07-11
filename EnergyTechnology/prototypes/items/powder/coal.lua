local name = 'technical-item-powder-coal'
local item = {
    type = 'item',
    name = name,

    icon = '__EnergyTechnology__/graphics/icons/powder-coal.png',
    dark_background_icon = '__EnergyTechnology__/graphics/icons/powder-coal-dark-background.png',
    icon_size = 32,

    stack_size = 100,

    flags = { 'goes-to-main-inventory' },
    subgroup = 'raw-material',
    order = 'c[technical-item-powder-coal]',

    fuel_value = '16MJ', --燃料热值
    fuel_category = 'chemical', --燃料种类
    fuel_acceleration_multiplier = 1.35, --燃料加速乘数
    fuel_top_speed_multiplier = 1.10, --燃料最高速度乘数
    fuel_emissions_multiplier = 0.7, --燃料污染乘数,

    pictures = {
        {
            filename = "__EnergyTechnology__/graphics/icons/powder-coal.png",
            width = 32,
            height = 32
        },
        {
            filename = "__EnergyTechnology__/graphics/icons/powder-coal-B.png",
            width = 32,
            height = 32
        },
        {
            filename = "__EnergyTechnology__/graphics/icons/powder-coal-C.png",
            width = 32,
            height = 32
        },
        {
            filename = "__EnergyTechnology__/graphics/icons/powder-coal-D.png",
            width = 32,
            height = 32
        },
    }
}
local recipe = {
    type = 'recipe',
    name = name,

    category = 'milling',

    energy_required = 2, --制作时间
    emissions_multiplier = 0.5, --污染乘数

    normal =
    {
        ingredients = {
            { 'coal', 1 }
        },
        result = name,
        result_count = 2,
    },
    expensive =
    {
        ingredients = {
            { 'coal', 2 }
        },
        result = name,
        result_count = 1,
    },
    
}
return {
    item = item,
    recipe = recipe
}