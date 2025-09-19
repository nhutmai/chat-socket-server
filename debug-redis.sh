#!/bin/bash

echo "🔍 Checking Redis connection..."
redis-cli ping

echo ""
echo "📊 Redis info:"
redis-cli info server | grep redis_version

echo ""
echo "📡 Active channels:"
redis-cli PUBSUB CHANNELS

echo ""
echo "👥 Subscribers count:"
redis-cli PUBSUB NUMSUB in-room-message notification

echo ""
echo "🧪 Testing message publish..."
redis-cli PUBLISH in-room-message '{"roomId":"test-room","data":{"message":"Debug test message","senderId":"debug-user"}}'

echo ""
echo "✅ Test completed!"
