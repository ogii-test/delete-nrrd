import React, { useContext, useRef } from 'react'
import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import {
  Box,
  Grid
} from '@material-ui/core'

import { useTheme } from '@material-ui/core/styles'

import StackedBarChart from '../../data-viz/StackedBarChart/StackedBarChart'
import SectionHeader from '../../sections/SectionHeader'
import HomeDataFilters from '../../../components/toolbars/HomeDataFilters'
import Link from '../../../components/Link/'
import ComparisonTable from '../ComparisonTable'

import utils from '../../../js/utils'

import { DataFilterContext } from '../../../stores/data-filter-store'
import { DATA_FILTER_CONSTANTS as DFC } from '../../../constants'

const TOTAL_REVENUE_QUERY = gql`
  query TotalYearlyRevenue {
    # total_yearly_fiscal_revenue { 
    #   year,
    #   source,
    #   sum
    # }
    total_yearly_fiscal_revenue: total_yearly_fiscal_revenue_2 {
      period
      sum
      source: land_type
      year
      revenue_type
      sort_order
      commodity_order
      commodity
      fiscalMonth: fiscal_month
      currentMonth: month
      monthLong: month_long
    }
    # total_yearly_calendar_revenue { 
    #   year,
    #   source,
    #   sum
    # }
    total_yearly_calendar_revenue: total_yearly_calendar_revenue_2 {
      period
      sum
      source: land_type
      year
      revenue_type
      sort_order
      commodity_order
      commodity
    }
    # total_monthly_fiscal_revenue {
    #   source
    #   sum
    #   month_long
    #   period_date
    #   month
    #   year
    # }
    total_monthly_fiscal_revenue: total_monthly_fiscal_revenue_2 {
      source: land_type
      sum
      month_long
      period_date
      month
      year
      revenue_type
      sort_order
      commodity_order
      commodity
    }
    # total_monthly_calendar_revenue {
    #   source
    #   sum
    #   month_long
    #   period_date
    #   month
    #   year
    # } 
    total_monthly_calendar_revenue: total_monthly_calendar_revenue_2 {
      source: land_type
      sum
      month_long
      period_date
      month
      year
      revenue_type
      sort_order
      commodity_order
      commodity
    } 
    # total_monthly_last_twelve_revenue {
    #   source
    #   sum
    #   month_long
    #   period_date
    #   month
    #   year
    # } 
    total_monthly_last_twelve_revenue_2 {
      source: land_type
      sum
      month_long
      period_date
      month
      year
      revenue_type
      sort_order
      commodity_order
      commodity
    }
    total_monthly_last_three_years_revenue {
      source: land_type
      sum
      month_long
      period_date
      month
      year
      revenue_type
      sort_order
      commodity_order
      commodity
    }
  }
`

// TotalRevenue component
const TotalRevenue = props => {
  const theme = useTheme()
  const { state: filterState } = useContext(DataFilterContext)
  const { monthly, period, breakoutBy } = filterState
  const revenueComparison = useRef(null)

  const chartTitle = props.chartTitle || `${ DFC.REVENUE } by ${ period.toLowerCase() } (dollars)`
  let yOrderBy
  switch (breakoutBy) {
  case 'revenue_type':
    yOrderBy = ['Royalties', 'Bonus', 'Rents', 'Other Revenues', 'Inspection Fees', 'Civil Penalties']
    break
  case 'commodity':
    yOrderBy = ['Not tied to a commodity', 'Other commodities', 'Coal', 'Gas', 'Oil']
    break
  default:
    yOrderBy = ['Federal onshore', 'Federal offshore', 'Native American', 'Federal - Not tied to a lease']
    break
  }

  const { loading, error, data } = useQuery(TOTAL_REVENUE_QUERY)

  const handleBarHover = d => {
    revenueComparison.current.setSelectedItem(d)
  }

  if (loading) {
    return 'Loading...'
  }

  if (error) return `Error! ${ error.message }`
  let chartData
  let comparisonData
  let xAxis
  const yAxis = 'sum'
  const yGroupBy = breakoutBy || DFC.SOURCE
  let xLabels = 'month'
  const units = 'dollars'
  let maxFiscalYear
  let maxCalendarYear
  let xGroups = {}
  let legendHeaders
  let currentMonthNum
  let currentMonthAbbr
  let currentYearSoFarText

  if (data) {
    maxFiscalYear = data.total_monthly_fiscal_revenue.reduce((prev, current) => {
      return (prev.year > current.year) ? prev.year : current.year
    })
    maxCalendarYear = data.total_monthly_calendar_revenue.reduce((prev, current) => {
      return (prev.year > current.year) ? prev.year : current.year
    })

    currentMonthNum = data.total_yearly_fiscal_revenue[data.total_yearly_fiscal_revenue.length - 1].currentMonth
    currentMonthAbbr = data.total_yearly_fiscal_revenue[data.total_yearly_fiscal_revenue.length - 1].monthLong.substring(0, 3)
    currentYearSoFarText = `so far (Oct - ${ currentMonthAbbr })`

    if (monthly === DFC.MONTHLY_CAPITALIZED) {
      if (period === DFC.PERIOD_FISCAL_YEAR) {
        switch (yGroupBy) {
        case 'revenue_type':
          comparisonData = data.total_monthly_fiscal_revenue.filter(item => yOrderBy.includes(item.revenue_type))
          chartData = data.total_monthly_fiscal_revenue.filter(item => (item.year >= maxFiscalYear && yOrderBy.includes(item.revenue_type)))
          break
        case 'commodity':
          comparisonData = data.total_monthly_fiscal_revenue.filter(item => yOrderBy.includes(item.commodity))
          chartData = data.total_monthly_fiscal_revenue.filter(item => (item.year >= maxFiscalYear && yOrderBy.includes(item.commodity)))
          break
        default:
          comparisonData = data.total_monthly_fiscal_revenue
          chartData = data.total_monthly_fiscal_revenue.filter(item => item.year >= maxFiscalYear)
          break
        }
      }
      else if (period === DFC.PERIOD_CALENDAR_YEAR) {
        switch (yGroupBy) {
        case 'revenue_type':
          comparisonData = data.total_monthly_calendar_revenue.filter(item => yOrderBy.includes(item.revenue_type))
          chartData = data.total_monthly_calendar_revenue.filter(item => (item.year >= maxCalendarYear && yOrderBy.includes(item.revenue_type)))
          break
        case 'commodity':
          comparisonData = data.total_monthly_calendar_revenue.filter(item => yOrderBy.includes(item.commodity))
          chartData = data.total_monthly_calendar_revenue.filter(item => (item.year >= maxCalendarYear && yOrderBy.includes(item.commodity)))
          break
        default:
          comparisonData = data.total_monthly_calendar_revenue
          chartData = data.total_monthly_calendar_revenue.filter(item => item.year >= maxCalendarYear)
          break
        }
      }
      else {
        switch (yGroupBy) {
        case 'revenue_type':
          comparisonData = data.total_monthly_last_three_years_revenue.filter(item => yOrderBy.includes(item.revenue_type))
          chartData = data.total_monthly_last_twelve_revenue_2.filter(item => yOrderBy.includes(item.revenue_type))
          break
        case 'commodity':
          comparisonData = data.total_monthly_last_three_years_revenue.filter(item => yOrderBy.includes(item.commodity))
          chartData = data.total_monthly_last_twelve_revenue_2.filter(item => yOrderBy.includes(item.commodity))
          break
        default:
          comparisonData = data.total_monthly_last_three_years_revenue
          chartData = data.total_monthly_last_twelve_revenue_2
	        console.debug('monthly last chart Data: ', data.total_monthly_last_twelve_revenue)
          break
        }
      }

      xGroups = chartData.reduce((g, row, i) => {
        const r = g
        const year = row.period_date.substring(0, 4)
        const months = g[year] || []
        months.push(row.month)
        r[year] = months
        return r
      }, {})

      xAxis = 'month_long'
      xLabels = (x, i) => {
        // console.debug('xLabels x: ', x)
        return x.map(v => v.substr(0, 3))
      }

      legendHeaders = (headers, row) => {
        const headerArr = [headers[0], '', `${ row.xLabel } ${ row.year }`]
        return headerArr
      }
    }
    else {
      if (period === DFC.PERIOD_FISCAL_YEAR) {
        switch (yGroupBy) {
        case 'revenue_type':
          comparisonData = data.total_yearly_fiscal_revenue.filter(item => yOrderBy.includes(item.revenue_type))
          chartData = data.total_yearly_fiscal_revenue.filter(item => (item.year >= maxFiscalYear - 9 && yOrderBy.includes(item.revenue_type)))
          break
        case 'commodity':
          comparisonData = data.total_yearly_fiscal_revenue.filter(item => yOrderBy.includes(item.commodity))
          chartData = data.total_yearly_fiscal_revenue.filter(item => (item.year >= maxFiscalYear - 9 && yOrderBy.includes(item.commodity)))
          break
        default:
          comparisonData = data.total_yearly_fiscal_revenue
          chartData = data.total_yearly_fiscal_revenue.filter(item => item.year >= maxFiscalYear - 9)
          break
        }
        xGroups[DFC.PERIOD_FISCAL_YEAR] = chartData.map((row, i) => row.year)
      }
      else {
        switch (yGroupBy) {
        case 'revenue_type':
          comparisonData = data.total_yearly_calendar_revenue.filter(item => yOrderBy.includes(item.revenue_type))
          chartData = data.total_yearly_calendar_revenue.filter(item => item.year <= maxCalendarYear && item.year >= maxCalendarYear - 9 && yOrderBy.includes(item.revenue_type))
          break
        case 'commodity':
          comparisonData = data.total_yearly_calendar_revenue.filter(item => yOrderBy.includes(item.commodity))
          chartData = data.total_yearly_calendar_revenue.filter(item => item.year <= maxCalendarYear && item.year >= maxCalendarYear - 9 && yOrderBy.includes(item.commodity))
          break
        default:
          comparisonData = data.total_yearly_calendar_revenue
          chartData = data.total_yearly_calendar_revenue.filter(item => item.year <= maxCalendarYear && item.year >= maxCalendarYear - 9)
          break
        }

        xGroups[DFC.PERIOD_CALENDAR_YEAR] = chartData.map((row, i) => row.year)
      }

      xAxis = 'year'
      xLabels = (x, i) => {
        return x.map(v => '\'' + v.toString().substr(2))
      }

      legendHeaders = (headers, row) => {
        const headerArr = [headers[0], '', `${ headers[2] } ${ (currentMonthNum !== parseInt('09') && headers[2] > maxFiscalYear) ? currentYearSoFarText : '' }`]
        return headerArr
      }
    }
  }
  return (
    <>
      <SectionHeader
        title="Total revenue"
        linkLabel="revenue"
        showExploreLink
      />
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <HomeDataFilters
            maxFiscalYear={maxFiscalYear}
            maxCalendarYear={maxCalendarYear} />
        </Grid>
        <Grid item xs={12} md={7}>
          <StackedBarChart
            key={`trsbc__${ monthly }${ period }${ breakoutBy }`}
            data={chartData}
            legendFormat={v => utils.formatToDollarInt(v)}
            title={chartTitle}
            units={units}
            xAxis={xAxis}
            xLabels={xLabels}
            yAxis={yAxis}
            xGroups={xGroups}
            yGroupBy={yGroupBy}
            yOrderBy={yOrderBy}
            legendHeaders={legendHeaders}
            primaryColor={theme.palette.chart.primary}
            secondaryColor={theme.palette.chart.secondary}
            handleBarHover={handleBarHover}
          />
          <Box fontStyle="italic" textAlign="left" fontSize="h6.fontSize">
            <Link href='/downloads/revenue-by-month/'>Source file</Link>
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <ComparisonTable
            key={`trct__${ monthly }${ period }${ breakoutBy }`}
            ref={revenueComparison}
            data={comparisonData}
            yGroupBy={yGroupBy}
          />
        </Grid>
      </Grid>
    </>
  )
}

export default TotalRevenue
