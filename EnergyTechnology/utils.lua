function ExtendAll(getTarget)
    return function (arg)
        local arr = {}
        for _, v in pairs(arg) do
            table.insert(arr, getTarget(v))
        end
        data:extend(arr)
    end
end

return {
    ExtendAll = ExtendAll
}