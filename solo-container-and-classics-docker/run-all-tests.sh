#!/bin/bash

echo "================================================================"
echo "  Docker Container Approaches - Comprehensive Test Suite"
echo "================================================================"
echo ""
echo "This script will test all three approaches:"
echo "  1a. Single container with systemd"
echo "  1b. Single container with supervisord"
echo "  2.  Two separate containers"
echo ""
echo "Each test will build, run, and verify the approach."
echo "Tests are isolated and will clean up after themselves."
echo ""

# Parse command line arguments
RUN_SYSTEMD=1
RUN_SUPERVISORD=1
RUN_SEPARATE=1
STOP_ON_FAILURE=0

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-systemd)
            RUN_SYSTEMD=0
            shift
            ;;
        --skip-supervisord)
            RUN_SUPERVISORD=0
            shift
            ;;
        --skip-separate)
            RUN_SEPARATE=0
            shift
            ;;
        --only-systemd)
            RUN_SUPERVISORD=0
            RUN_SEPARATE=0
            shift
            ;;
        --only-supervisord)
            RUN_SYSTEMD=0
            RUN_SEPARATE=0
            shift
            ;;
        --only-separate)
            RUN_SYSTEMD=0
            RUN_SUPERVISORD=0
            shift
            ;;
        --stop-on-failure)
            STOP_ON_FAILURE=1
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-systemd       Skip systemd tests"
            echo "  --skip-supervisord   Skip supervisord tests"
            echo "  --skip-separate      Skip separate containers tests"
            echo "  --only-systemd       Run only systemd tests"
            echo "  --only-supervisord   Run only supervisord tests"
            echo "  --only-separate      Run only separate containers tests"
            echo "  --stop-on-failure    Stop testing if any test fails"
            echo "  --help               Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Track results
RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local approach_name="$1"
    local approach_dir="$2"
    local test_script="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo ""
    echo "================================================================"
    echo "  Testing: $approach_name"
    echo "================================================================"
    echo ""

    cd "$approach_dir"

    if bash "$test_script"; then
        RESULTS+=("✅ PASSED: $approach_name")
        PASSED_TESTS=$((PASSED_TESTS + 1))
        cd - > /dev/null
        return 0
    else
        RESULTS+=("❌ FAILED: $approach_name")
        FAILED_TESTS=$((FAILED_TESTS + 1))
        cd - > /dev/null
        return 1
    fi
}

# Run tests
START_TIME=$(date +%s)

if [ $RUN_SYSTEMD -eq 1 ]; then
    if ! run_test "Approach 1a: Single Container with systemd" \
                   "approach1-systemd" \
                   "test.sh"; then
        if [ $STOP_ON_FAILURE -eq 1 ]; then
            echo ""
            echo "⚠️  Stopping due to test failure (--stop-on-failure enabled)"
            exit 1
        fi
    fi
    echo ""
    echo "Press Enter to continue to next test..."
    read -r
fi

if [ $RUN_SUPERVISORD -eq 1 ]; then
    if ! run_test "Approach 1b: Single Container with supervisord" \
                   "approach1-single-container" \
                   "test.sh"; then
        if [ $STOP_ON_FAILURE -eq 1 ]; then
            echo ""
            echo "⚠️  Stopping due to test failure (--stop-on-failure enabled)"
            exit 1
        fi
    fi
    echo ""
    echo "Press Enter to continue to next test..."
    read -r
fi

if [ $RUN_SEPARATE -eq 1 ]; then
    run_test "Approach 2: Two Separate Containers" \
             "approach2-separate-containers" \
             "test.sh"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Print summary
echo ""
echo ""
echo "================================================================"
echo "  FINAL TEST SUMMARY"
echo "================================================================"
echo ""
echo "Total tests run:    $TOTAL_TESTS"
echo "Tests passed:       $PASSED_TESTS"
echo "Tests failed:       $FAILED_TESTS"
echo "Duration:           ${DURATION}s"
echo ""
echo "Results:"
for result in "${RESULTS[@]}"; do
    echo "  $result"
done
echo ""

# Print recommendations
echo "================================================================"
echo "  RECOMMENDATIONS"
echo "================================================================"
echo ""
if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ All approaches are working correctly!"
    echo ""
else
    echo "⚠️  Some tests failed. Check the logs above for details."
    echo ""
fi

echo "Production Recommendations:"
echo "  1. ✅ USE: Approach 2 (Separate Containers)"
echo "     - Best practices, security, scalability"
echo ""
echo "  2. ⚠️  AVOID: Approach 1b (supervisord)"
echo "     - Only for prototypes or legacy migrations"
echo ""
echo "  3. ❌ NEVER: Approach 1a (systemd)"
echo "     - Requires --privileged, major security risk"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi
