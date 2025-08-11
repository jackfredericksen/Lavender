#!/bin/bash
echo "🔍 Verifying license headers..."
echo "MIT licensed files:"
grep -r "SPDX-License-Identifier: MIT" contracts/ || echo "No MIT files found"
echo ""
echo "Commercial licensed files:"
grep -r "proprietary and confidential" utils/ frontend/ src/ 2>/dev/null || echo "No commercial files found"
echo ""
echo "✅ Verification complete"
