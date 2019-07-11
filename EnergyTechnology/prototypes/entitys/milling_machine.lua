local name = 'technical-entity-milling_machine'
local item = {
    type = 'item',
    name = name,

    icon = '__base__/graphics/icons/stone-furnace.png',
    icon_size = 32,

    flags = {'goes-to-quickbar'},
    subgroup = 'milling-machine',

    order = 'c[technical-entity-milling_machine]',

    stack_size = 50,

    place_result = name
}
local recipe = {
    type = 'recipe',
    name = name,
    result = name,
    ingredients = {{'steel-plate', 5}, {'advanced-circuit', 5}},
    energy_required = 3,
}
local entity = {
    type = 'furnace',
    name = name,

    icon = '__base__/graphics/icons/stone-furnace.png',
    icon_size = 32,

    flags = {'placeable-neutral', 'placeable-player', 'player-creation'},
    subgroup = 'milling-machine',

    minable = {
        mining_time = 1,
        result = name,
        mining_particle = 'shell-particle'
    }, -- 挖掘掉落自身

    collision_box = {{-1, -1}, {1, 1}}, -- 碰撞盒
    selection_box = {{-1.3, -1.3}, {1.3, 1.3}}, -- 选择盒

    max_health = 300, -- 生命值
    dying_explosion = 'medium-explosion', -- 死亡生成爆炸
    resistances = {{type = 'fire', percent = 80}}, -- 抗性

    module_specification = {module_slots = 3, module_info_icon_shift = {0, 0.8}}, -- 效果插件设置
    allowed_effects = {"consumption", "speed", "productivity", "pollution"}, -- 允许的效果插件

    crafting_categories = {'milling'}, -- 允许的配方种类
    crafting_speed = 1, -- 配方制作速度乘数

    source_inventory_size = 1, -- 输入格子数
    result_inventory_size = 1, -- 输出格子数

    energy_usage = '75kW', -- 耗电
    energy_source = { -- 电源设置
        type = 'electric',
        usage_priority = 'secondary-input', -- 电源重要级
        emissions = 0.010 -- 污染
    },

    vehicle_impact_sound = { -- 车撞上去的声音
        filename = "__base__/sound/car-metal-impact.ogg",
        volume = 0.65
    },
    working_sound = { -- 工作声音
        sound = {filename = "__base__/sound/electric-furnace.ogg", volume = 0.7},
        apparent_volume = 1.5
    },

    animation =
    {
    layers =
      {
        {
        filename = "__base__/graphics/entity/stone-furnace/stone-furnace.png",
        priority = "extra-high",
        width = 81,
        height = 64,
        frame_count = 1,
        shift = {0.515625, 0.0625},
        hr_version =
        {
          filename = "__base__/graphics/entity/stone-furnace/hr-stone-furnace.png",
          priority = "extra-high",
          width = 151,
          height = 146,
          frame_count = 1,
          shift = util.by_pixel(-0.25, 6),
          scale = 0.5
          }
        },
        {
        filename = "__base__/graphics/entity/stone-furnace/stone-furnace-shadow.png",
        priority = "extra-high",
        width = 81,
        height = 64,
        frame_count = 1,
        draw_as_shadow = true,
        shift = {0.515625, 0.0625},
        hr_version =
        {
          filename = "__base__/graphics/entity/stone-furnace/hr-stone-furnace-shadow.png",
          priority = "extra-high",
          width = 164,
          height = 74,
          frame_count = 1,
          draw_as_shadow = true,
          shift = util.by_pixel(14.5, 13),
          scale = 0.5
          }
        }
      }
    },
}
return {entity = entity, item = item, recipe = recipe}
