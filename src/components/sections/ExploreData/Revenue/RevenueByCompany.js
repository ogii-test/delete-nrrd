import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { useQuery } from '@apollo/react-hooks'
import gql from 'graphql-tag'

import QueryLink from '../../../../components/QueryLink'

import { DataFilterContext } from '../../../../stores/data-filter-store'
import { DATA_FILTER_CONSTANTS as DFC } from '../../../../constants'

import {
  Box,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Hidden,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@material-ui/core'

import { useTheme, makeStyles } from '@material-ui/core/styles'

import StackedBarChart from '../../../data-viz/StackedBarChart/StackedBarChart'

import utils from '../../../../js/utils'

const useStyles = makeStyles(theme => ({
  root: {}
}))

// revenue type by land but just take one year of front page to do poc
const NATIONAL_REVENUE_SUMMARY_QUERY = gql`
  query RevenueNational($year: Int!, $commodities: [String!]) {
   federal_revenue_by_company_type_summary(order_by: {company_rank: asc, type_order: desc }, where: {calendar_year: {_eq: $year}, commodity: {_in: $commodities} }) {
    corporate_name
    calendar_year
    revenue_type
    commodity
    total
    percent_of_revenue
    revenue
   }
  }
`

const RevenueByCompany = props => {
  const theme = useTheme()
  const classes = useStyles()
  const { state: filterState } = useContext(DataFilterContext)
  const year = (filterState[DFC.YEAR]) ? filterState[DFC.YEAR] : 2019
  const period = (filterState[DFC.PERIOD]) ? filterState[DFC.PERIOD] : 'Fiscal Year'
  const commodities = (filterState[DFC.COMMODITY]) ? filterState[DFC.COMMODITY].split(',') : undefined
  const { title } = props

  const { loading, error, data } = useQuery(NATIONAL_REVENUE_SUMMARY_QUERY, {
    variables: { year: year, commodities: commodities },
    skip: period !== 'Calendar Year'
  })

  const yOrderBy = ['Federal Onshore', 'Federal Offshore', 'Native American', 'Federal - Not tied to a lease']

  let groupData
  let groupTotal
  let remainingTotal
  let totalTotal
  let remainingPercent

  let nationalRevenueData
  const xAxis = 'year'
  const yAxis = 'revenue'
  const yGroupBy = 'revenue_type'

  const units = 'dollars'

  if (loading) {
    return 'Loading...'
  }

  if (error) return `Error! ${ error.message }`

  if (data && data.federal_revenue_by_company_type_summary.length > 0) {
    /*  chartData = d3.nest()
          .key(k => k.revenue_type)
          .rollup(v => d3.sum(v, i => i.total))
          .entries(data.revenue_type_summary)
          .map(d => ({ revenue_type: d.key, total: d.value }))
  } */
    groupData = utils.groupBy(data.federal_revenue_by_company_type_summary, 'corporate_name')
    groupTotal = Object.keys(groupData).filter((d, i) => i < 1)
      .map(k => groupData[k].reduce((revenue, i) => (revenue += i.revenue), 0)).reduce((revenue, s) => (revenue += s), 0)
    nationalRevenueData = Object.entries(groupData)
    remainingTotal = Object.keys(groupData)
      .filter((d, i) => i > 9).map(k => groupData[k].reduce((revenue, i) => (revenue += i.revenue), 0)).reduce((revenue, s) => (revenue += s), 0)
    totalTotal = Object.keys(groupData).map(k => groupData[k].reduce((revenue, i) => (revenue += i.revenue), 0)).reduce((revenue, s) => (revenue += s), 0)
    remainingPercent = remainingTotal / totalTotal * 100

    return (
      <Container id={utils.formatToSlug(title)}>
        <Grid container>
          <Grid item xs={12}>
            <Box color="secondary.main" mt={5} mb={2} borderBottom={2}>
              <Box component="h3" color="secondary.dark">{title}</Box>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Hidden smDown>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ fontWeight: 'bold' }}>Company</TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>Percent</TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>
                      <Box display="flex" justifyContent="space-between">
                        <Box component="span">Revenue type</Box>
                        <Box component="span">
                          {`${ period } ${ year }`}
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  { nationalRevenueData &&
                nationalRevenueData.filter((d, i) => i < 10).map((item, i) => {
                  return (
                    <TableRow key={i}>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box component="p" mt={0}>{item[0]}</Box>
                        <Box component="p"></Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box mt={0}>{utils.formatToDollarInt(item[1][0].total)}</Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box mt={0}>{item[1][0].percent_of_revenue.toFixed(2)}%</Box>
                      </TableCell>
                      <TableCell style={{ width: '45%' }}>
                        <StackedBarChart
                          key={'NRS' + year + '_' + i}
                          data={item[1]}
                          collapsibleLegend={true}
                          collapsedLegend={true}
                          legendFormat={v => {
                            if (v === 0) {
                              return '-'
                            }
                            else {
                              return utils.formatToDollarInt(v)
                            }
                          }}
                          legendHeaders={ headers => {
                            // console.debug('headers..................', headers)
                            headers[0] = ''
                            headers[2] = ''
                            return headers
                          }
                          }
                          // eslint-disable-next-line no-return-assign
                          barScale={item[1].reduce((total, i) => total += i.revenue, 0) / groupTotal }
                          units={units}
                          xAxis={xAxis}
                          yAxis={yAxis}
                          yGroupBy={yGroupBy}
                          yOrderBy={yOrderBy}
                          horizontal
                          legendReverse={true}
                          colorRange={[
                            theme.palette.explore[700],
                            theme.palette.explore[600],
                            theme.palette.explore[500],
                            theme.palette.explore[400],
                            theme.palette.explore[300],
                            theme.palette.explore[200],
                            theme.palette.explore[100]
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
                  }
                  { nationalRevenueData && <>
                    <TableRow>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box component="h4" mt={0}>Other companies</Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box mt={0}>{utils.formatToDollarInt(remainingTotal)}</Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box mt={0}>{remainingPercent.toFixed(2)}%</Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top', width: '45%' }}>
                        <QueryLink
                          groupBy={DFC.REVENUE_TYPE}
                          dataType={DFC.REVENUE_BY_COMPANY}
                          linkType="FilterTable"
                          {...props}
                          mt={0}>
                          Query revenue data for all { nationalRevenueData.length } companies.
                        </QueryLink>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box component="h4" mt={0}>Total</Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box mt={0}>{utils.formatToDollarInt(totalTotal)}</Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top' }}>
                        <Box mt={0}>100%</Box>
                      </TableCell>
                      <TableCell style={{ verticalAlign: 'top', width: '45%' }}>
                      </TableCell>
                    </TableRow>
                  </>
                  }
                </TableBody>
              </Table>
            </Hidden>
            <Hidden mdUp>
              {nationalRevenueData &&
              nationalRevenueData.filter((d, i) => i < 10).map((item, i) => {
                return (
                  <Box pb={2} mb={2} border={1} borderTop={0} borderLeft={0} borderRight={0} borderColor={theme.palette.grey[400]}>
                    <Box fontWeight="bold">{item[0]}</Box>
                    <Box display="flex" justifyContent="flex-end">{utils.formatToDollarInt(item[1][0].total)}</Box>
                    <Box display="flex" justifyContent="flex-end">{item[1][0].percent_of_revenue.toFixed(2)}%</Box>
                    <Box display="flex" justifyContent="space-between" fontWeight="bold" mt={2}>
                      <Box component="span">Revenue type</Box>
                      <Box component="span">{`${ period } ${ year }`}</Box>
                    </Box>
                    <Box>
                      <StackedBarChart
                        key={'NRS' + year + '_' + i}
                        data={item[1]}
                        collapsibleLegend={true}
                        collapsedLegend={true}
                        legendFormat={v => {
                          if (v === 0) {
                            return '-'
                          }
                          else {
                            return utils.formatToDollarInt(v)
                          }
                        }}
                        legendHeaders={ headers => {
                          // console.debug('headers..................', headers)
                          headers[0] = ''
                          headers[2] = ''
                          return headers
                        }
                        }
                        // eslint-disable-next-line no-return-assign
                        barScale={item[1].reduce((total, i) => total += i.revenue, 0) / groupTotal }
                        units={units}
                        xAxis={xAxis}
                        yAxis={yAxis}
                        yGroupBy={yGroupBy}
                        yOrderBy={yOrderBy}
                        horizontal
                        legendReverse={true}
                        colorRange={[
                          theme.palette.explore[700],
                          theme.palette.explore[600],
                          theme.palette.explore[500],
                          theme.palette.explore[400],
                          theme.palette.explore[300],
                          theme.palette.explore[200],
                          theme.palette.explore[100]
                        ]}
                      />
                    </Box>
                  </Box>
                )
              })
              }
              { nationalRevenueData &&
                <>
                  <Box pb={2} mb={2} border={1} borderTop={0} borderLeft={0} borderRight={0} borderColor={theme.palette.grey[400]}>
                    <Box fontWeight="bold">Other companies</Box>
                    <Box display="flex" justifyContent="flex-end">{utils.formatToDollarInt(remainingTotal)}</Box>
                    <Box display="flex" justifyContent="flex-end">{remainingPercent.toFixed(2)}%</Box>
                    <Box>
                      <QueryLink
                        groupBy={DFC.REVENUE_TYPE}
                        dataType={DFC.REVENUE_BY_COMPANY}
                        linkType="FilterTable"
                        {...props}
                        mt={3}>
                          Query revenue data for all { nationalRevenueData.length } companies.
                      </QueryLink>
                    </Box>
                  </Box>
                  <Box pb={2} mb={2} border={1} borderTop={0} borderLeft={0} borderRight={0} borderColor={theme.palette.grey[400]}>
                    <Box fontWeight="bold">Total</Box>
                    <Box display="flex" justifyContent="flex-end">{utils.formatToDollarInt(totalTotal)}</Box>
                    <Box display="flex" justifyContent="flex-end">100%</Box>
                  </Box>
                </>
              }
            </Hidden>
          </Grid>
        </Grid>
      </Container>
    )
  }
  else {
    return (null)
  }
}

export default RevenueByCompany

RevenueByCompany.propTypes = {
  title: PropTypes.string
}
