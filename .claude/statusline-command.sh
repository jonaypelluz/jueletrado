#!/bin/bash
INPUT=$(cat)

CTX_PCT=$(echo "$INPUT" | jq -r '.context_window.used_percentage // empty' 2>/dev/null)
RATE_5H=$(echo "$INPUT" | jq -r '.rate_limits.five_hour.used_percentage // empty' 2>/dev/null)
RATE_7D=$(echo "$INPUT" | jq -r '.rate_limits.seven_day.used_percentage // empty' 2>/dev/null)
RESET_5H=$(echo "$INPUT" | jq -r '.rate_limits.five_hour.resets_at // empty' 2>/dev/null)
RESET_7D=$(echo "$INPUT" | jq -r '.rate_limits.seven_day.resets_at // empty' 2>/dev/null)
MODEL=$(echo "$INPUT" | jq -r '.model.id // .model // empty' 2>/dev/null)
[ -z "$MODEL" ] && MODEL="claude"

FOLDER=$(basename "$PWD")
BRANCH=$(git -C "$PWD" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

reset=$'\e[0m'
bg_steel_blue=$'\e[48;5;24m'
fg_white=$'\e[38;5;255m'
fg_yellow=$'\e[38;5;229m'
fg_purple=$'\e[38;5;99m'
fg_gray=$'\e[38;5;238m'
fg_dark=$'\e[38;5;232m'

INSTANCE="${DHM_INSTANCE:-}"

if [ -n "$INSTANCE" ]; then
    case "$INSTANCE" in
        main)     instance_bg=$'\e[48;5;24m' ;;
        team)     instance_bg=$'\e[48;5;28m' ;;
        personal) instance_bg=$'\e[48;5;130m' ;;
        *)        instance_bg=$'\e[48;5;238m' ;;
    esac
    instance_badge="${instance_bg}${fg_white} ${INSTANCE} ${reset}"
fi

if [ -n "$BRANCH" ]; then
    pill="${bg_steel_blue}${fg_white} ${FOLDER} ${fg_yellow}${BRANCH} ${reset}"
else
    pill="${bg_steel_blue}${fg_white} ${FOLDER} ${reset}"
fi

if [ -n "$CTX_PCT" ]; then
    CTX_INT=$(printf "%.0f" "$CTX_PCT" 2>/dev/null || echo "0")
    FILLED=$(( CTX_INT * 10 / 100 ))
    [ $FILLED -gt 10 ] && FILLED=10
    EMPTY=$(( 10 - FILLED ))
    bar_blocks=""
    i=0; while [ $i -lt $FILLED ]; do bar_blocks="${bar_blocks}${fg_purple}█"; i=$(( i + 1 )); done
    i=0; while [ $i -lt $EMPTY ];  do bar_blocks="${bar_blocks}${fg_gray}░";  i=$(( i + 1 )); done
    ctx_section="ctx: ${CTX_INT}% [${bar_blocks}${reset}]"
else
    ctx_section="ctx: ?% [${fg_gray}░░░░░░░░░░${reset}]"
fi

fmt_remaining() {
    local epoch="$1"
    [ -z "$epoch" ] && echo "" && return
    local now remaining hours mins
    now=$(date +%s)
    remaining=$(( epoch - now ))
    [ $remaining -le 0 ] && echo "now" && return
    hours=$(( remaining / 3600 ))
    mins=$(( (remaining % 3600) / 60 ))
    if [ $hours -ge 24 ]; then
        local days=$(( hours / 24 ))
        local rhours=$(( hours % 24 ))
        echo "${days}d${rhours}h"
    elif [ $hours -gt 0 ]; then
        echo "${hours}h${mins}m"
    else
        echo "${mins}m"
    fi
}

rate_badge() {
    local label="$1"
    local pct_raw="$2"
    local reset_epoch="$3"
    local pct_int bg time_str suffix

    if [ -z "$pct_raw" ]; then
        printf "%s%s %s: ? %s" $'\e[48;5;238m' "$fg_dark" "$label" "$reset"
        return
    fi

    pct_int=$(printf "%.0f" "$pct_raw" 2>/dev/null || echo "0")
    if [ "$pct_int" -lt 40 ]; then
        bg=$'\e[48;5;71m'
    elif [ "$pct_int" -le 80 ]; then
        bg=$'\e[48;5;179m'
    else
        bg=$'\e[48;5;131m'
    fi

    time_str=$(fmt_remaining "$reset_epoch")
    [ -n "$time_str" ] && suffix=" ↺${time_str}" || suffix=""

    printf "%s%s %s: %s%%%s %s" "$bg" "$fg_dark" "$label" "$pct_int" "$suffix" "$reset"
}

badge_5h=$(rate_badge "5h" "$RATE_5H" "$RESET_5H")
badge_7d=$(rate_badge "7d" "$RATE_7D" "$RESET_7D")

MODEL_SHORT=$(echo "$MODEL" | sed 's/claude-//; s/-20[0-9]\{6\}//')
model_section="${fg_gray}${MODEL_SHORT}${reset}"

if [ -n "$INSTANCE" ]; then
    printf "%s | %s | %s | %s | %s | %s\n" "$instance_badge" "$pill" "$model_section" "$ctx_section" "$badge_5h" "$badge_7d"
else
    printf "%s | %s | %s | %s | %s\n" "$pill" "$model_section" "$ctx_section" "$badge_5h" "$badge_7d"
fi
